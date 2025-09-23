import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { parse } from "@babel/parser";

import { EnhancedGraphData } from "../types/enhancedgraphdata.interface";
import { GraphData } from "../types/graphdata.interface";
import { excludedPatterns } from "../config/excludedPatterns";
import { resolveImportPath } from "./resolveImportPath";
import { detectCycles } from "./detectCycles";

export async function getDependencyGraph(): Promise<EnhancedGraphData> {
  const graph: GraphData = {
    nodes: [],
    links: [],
  };
  const nodeSet = new Set<string>();

  const workspaceRoot = vscode.workspace.workspaceFolders
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : "";

  console.log("Starting to search for files...");
  const files = await vscode.workspace.findFiles(
    "{**/*.js,**/*.jsx,**/*.ts,**/*.tsx}",
    "**/node_modules/**"
  );
  console.log(`Found ${files.length} files.`);

  const filteredFiles = files.filter((file) => {
    const relativePath = path.relative(workspaceRoot, file.fsPath);
    return !excludedPatterns.some((pattern) => pattern.test(relativePath));
  });

  console.log(`Filtered down to ${filteredFiles.length} files.`);

  try {
    for (const file of filteredFiles) {
      const filePath = file.fsPath;
      const relativePath = path
        .relative(workspaceRoot, filePath)
        .replace(/\\/g, "/");

      if (!nodeSet.has(relativePath)) {
        graph.nodes.push({ id: relativePath });
        nodeSet.add(relativePath);
      }

      const fileContent = fs.readFileSync(filePath, "utf-8");

      try {
        const ast = parse(fileContent, {
          sourceType: "unambiguous",
          plugins: ["jsx", "typescript"],
        });

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
              } else {
                // specifier is ImportSpecifier
                return specifier.imported.type === "Identifier"
                  ? specifier.imported.name
                  : specifier.imported.value;
              }
            });
          } else if (
            node.type === "VariableDeclaration" ||
            node.type === "ExpressionStatement"
          ) {
            let expression =
              node.type === "VariableDeclaration"
                ? node.declarations[0]?.init
                : node.expression;
            if (
              expression?.type === "CallExpression" &&
              expression.callee.type === "Identifier" &&
              expression.callee.name === "require" &&
              expression.arguments.length > 0 &&
              expression.arguments[0].type === "StringLiteral"
            ) {
              importPath = expression.arguments[0].value;
            }
          }

          if (importPath) {
            const resolvedPath = await resolveImportPath(filePath, importPath);
            if (resolvedPath) {
              if (resolvedPath.includes("node_modules")) {
                continue;
              }
              const relativeResolvedPath = path
                .relative(workspaceRoot, resolvedPath)
                .replace(/\\/g, "/");
              if (!nodeSet.has(relativeResolvedPath)) {
                graph.nodes.push({ id: relativeResolvedPath });
                nodeSet.add(relativeResolvedPath);
              }
              graph.links.push({
                source: relativePath,
                target: relativeResolvedPath,
                specifiers: specifiers.length > 0 ? specifiers : undefined,
              });
            }
          }
        }
      } catch (e) {
        console.error(`Error parsing file: ${relativePath}`, e);
      }
    }
    console.log(
      "Graph generation complete. Result:",
      JSON.stringify(graph, null, 2)
    );
  } catch (e) {
    console.error("An unexpected error occurred during graph generation:", e);
  }

  // --- MODIFIED ---
  // After building the graph, we now call our new function to find cycles.
  const cycles = detectCycles(graph.nodes, graph.links);
  console.log(`Cycle detection complete. Found ${cycles.length} cycles.`);

  // We return the graph data, now including the cycles we just found.
  return { ...graph, cycles };
}