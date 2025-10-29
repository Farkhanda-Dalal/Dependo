import * as vscode from "vscode";
import * as path from "path";
import { promises as fs } from "fs"; // Use the 'promises' API for async operations
import { parse } from "@babel/parser";
import { ExpressionStatement, VariableDeclaration } from "@babel/types";

import { EnhancedGraphData } from "../types/enhancedgraphdata.interface";
import { GraphData } from "../types/graphdata.interface";
import { excludedPatterns } from "../config/excludedPatterns";
import { resolveImportPath } from "./resolveImportPath";
import { detectCycles } from "./detectCycles";

// Define an interface for the file processing result
interface FileProcessingResult {
  sourcePath: string;
  imports: Array<{
    targetPath: string;
    specifiers: string[] | undefined;
  }>;
}

/**
 * Processes a single file to find all its imports.
 * This function is designed to be run in parallel.
 */
async function processFile(
  fileUri: vscode.Uri,
  workspaceRoot: string
): Promise<FileProcessingResult | null> {
  const filePath = fileUri.fsPath;
  const relativePath = path.relative(workspaceRoot, filePath).replace(/\\/g, "/");
  const imports: FileProcessingResult["imports"] = [];

  try {
    // 1. Use async file read
    const fileContent = await fs.readFile(filePath, "utf-8");

    // 2. Parse the file
    const ast = parse(fileContent, {
      sourceType: "unambiguous",
      plugins: ["jsx", "typescript"],
      errorRecovery: true, // Be more resilient to syntax errors
    });

    // 3. Find imports
    for (const node of ast.program.body) {
      let importPath: string | null = null;
      let specifiers: string[] = [];

      if (node.type === "ImportDeclaration") {
        importPath = node.source.value;
        specifiers = node.specifiers.map((specifier) => {
          if (specifier.type === "ImportDefaultSpecifier") {
            return `${specifier.local.name} (default)`;
          } else if (specifier.type === "ImportNamespaceSpecifier") {
            return `* as ${specifier.local.name}`;
          } else { // ImportSpecifier
            const imported = specifier.imported;
            return imported.type === "Identifier"
              ? imported.name
              : imported.value;
          }
        });
      } else if (
        (node.type === "VariableDeclaration" || node.type === "ExpressionStatement") &&
        isRequireCall(node)
      ) {
         // This logic is complex, so let's use a type-safe helper
        const expression = node.type === "VariableDeclaration" ? node.declarations[0].init : node.expression;
        if (expression?.type === "CallExpression" && expression.arguments[0].type === "StringLiteral") {
             importPath = expression.arguments[0].value;
        }
      }

      // 4. Resolve the import path
      if (importPath) {
        const resolvedPath = await resolveImportPath(filePath, importPath);
        if (resolvedPath && !resolvedPath.includes("node_modules")) {
          const relativeResolvedPath = path
            .relative(workspaceRoot, resolvedPath)
            .replace(/\\/g, "/");
            
          imports.push({
            targetPath: relativeResolvedPath,
            specifiers: specifiers.length > 0 ? specifiers : undefined,
          });
        }
      }
    }

    return { sourcePath: relativePath, imports };

  } catch (e) {
    console.error(`Error processing file: ${relativePath}`, e);
    return null; // Return null to signify failure for this file
  }
}

// Helper to check for 'require' calls
function isRequireCall(node: VariableDeclaration | ExpressionStatement): boolean {
    const expression = node.type === "VariableDeclaration" ? node.declarations[0]?.init : node.expression;
    return (
        expression?.type === "CallExpression" &&
        expression.callee.type === "Identifier" &&
        expression.callee.name === "require" &&
        expression.arguments.length > 0 &&
        expression.arguments[0].type === "StringLiteral"
    );
}

export async function getDependencyGraph(): Promise<EnhancedGraphData> {
  const graph: GraphData = {
    nodes: [],
    links: [],
  };
  const nodeSet = new Set<string>();

  const workspaceRoot = vscode.workspace.workspaceFolders
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : "";

  if (!workspaceRoot) {
    return { ...graph, cycles: [] }; // No workspace, return empty graph
  }

  console.log("Starting to search for files...");
  const allFiles = await vscode.workspace.findFiles(
    "{**/*.js,**/*.jsx,**/*.ts,**/*.tsx}",
    "**/node_modules/**"
  );

  const filteredFiles = allFiles.filter((file) => {
    const relativePath = path.relative(workspaceRoot, file.fsPath);
    return !excludedPatterns.some((pattern) => pattern.test(relativePath));
  });
  console.log(`Filtered down to ${filteredFiles.length} files. Starting processing...`);

  // --- Parallel Processing ---
  // 1. Create an array of promises. Each promise processes one file.
  const processingPromises = filteredFiles.map((file) =>
    processFile(file, workspaceRoot)
  );

  // 2. Wait for all promises to settle (either fulfill or reject)
  const results = await Promise.allSettled(processingPromises);
  // --- End of Parallel Processing ---


  // --- Graph Assembly (now separate from processing) ---
  // 3. Iterate over the results and build the graph
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      const { sourcePath, imports } = result.value;

      // Add the source node (the file itself)
      if (!nodeSet.has(sourcePath)) {
        graph.nodes.push({ id: sourcePath });
        nodeSet.add(sourcePath);
      }

      // Add all imported nodes and the links
      for (const imp of imports) {
        // Add the target node (the imported file)
        if (!nodeSet.has(imp.targetPath)) {
          graph.nodes.push({ id: imp.targetPath });
          nodeSet.add(imp.targetPath);
        }
        
        // Add the link
        graph.links.push({
          source: sourcePath,
          target: imp.targetPath,
          specifiers: imp.specifiers,
        });
      }
    } else if (result.status === "rejected") {
        // Log errors from promises that failed
        console.error("A file processing promise was rejected:", result.reason);
    }
  }
  // --- End of Graph Assembly ---

  console.log(
    `Graph generation complete. ${graph.nodes.length} nodes, ${graph.links.length} links.`
  );
  
  const cycles = detectCycles(graph.nodes, graph.links);
  console.log(`Cycle detection complete. Found ${cycles.length} cycles.`);

  return { ...graph, cycles };
}