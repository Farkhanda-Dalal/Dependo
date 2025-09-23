import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { parse } from "@babel/parser";
import resolve from "resolve";

export interface GraphData {
  nodes: { id: string }[];
  links: { source: string; target: string }[];
}

export async function getDependencyGraph(): Promise<GraphData> {
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

  try {
    for (const file of files) {
      const filePath = file.fsPath;
      const relativePath = path
        .relative(workspaceRoot, filePath)
        .replace(/\\/g, "/"); // Normalize path separators

      if (!nodeSet.has(relativePath)) {
        graph.nodes.push({ id: relativePath });
        nodeSet.add(relativePath);
      }

      const fileContent = fs.readFileSync(filePath, "utf-8");

      // ... (rest of the function)

      try {
        const ast = parse(fileContent, {
          sourceType: "module",
          plugins: ["jsx", "typescript"],
        });

        for (const node of ast.program.body) {
          let importPath: string | null = null;

          // Check for ES6 Import statements
          if (node.type === "ImportDeclaration") {
            importPath = node.source.value;
          }
          // Check for CommonJS Require statements
          else if (
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

          // Process the found import/require path
          if (importPath) {
            const resolvedPath = await resolveImportPath(filePath, importPath);

            if (resolvedPath) {
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
              });
            }
          }
        }
      } catch (e) {
        console.error(`Error parsing file: ${relativePath}`, e);
      }

      // ... (rest of the function)
    }
    console.log(
      "Graph generation complete. Result:",
      JSON.stringify(graph, null, 2)
    );
  } catch (e) {
    console.error("An unexpected error occurred during graph generation:", e);
  }

  return graph;
}

export async function getDirectoryStructure(): Promise<any> {
  const workspaceRoot = vscode.workspace.workspaceFolders
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : "";
  if (!workspaceRoot) {
    return {};
  }

  const structure = {};

  function traverseDir(currentPath: string, parentObj: any) {
    const items = fs.readdirSync(currentPath, { withFileTypes: true });

    items.forEach((item) => {
      if (item.isDirectory() && item.name !== "node_modules") {
        const folderName = item.name;
        parentObj[folderName] = {};
        traverseDir(path.join(currentPath, folderName), parentObj[folderName]);
      }
    });
  }

  try {
    traverseDir(workspaceRoot, structure);
    return structure;
  } catch (e) {
    console.error("Error generating directory structure:", e);
    return {};
  }
}

function resolveImportPath(
  currentFilePath: string,
  importPath: string
): Promise<string | null> {
  return new Promise((res) => {
    resolve(
      importPath,
      {
        basedir: path.dirname(currentFilePath),
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
      (error: Error | null, resolvedPath: string | undefined) => {
        if (error || !resolvedPath) {
          console.error(
            `Could not resolve import for '${importPath}' in file '${currentFilePath}'`
          );
          res(null);
        } else {
          res(resolvedPath);
        }
      }
    );
  });
}
