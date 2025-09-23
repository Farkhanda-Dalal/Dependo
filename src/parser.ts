import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { parse } from "@babel/parser";
import resolve from "resolve";

// Your existing interface. We will not touch this.
export interface GraphData {
  nodes: { id: string }[];
  links: { source: string; target: string }[];
}

// Defines the structure for a single circular dependency found.
export interface Cycle {
  nodes: string[];
  links: { source: string; target: string }[];
}

// This new interface extends your original GraphData and adds the cycles array.
export interface EnhancedGraphData extends GraphData {
  cycles: Cycle[];
}

// --- NEW FUNCTION: detectCycles STARTS HERE ---

/**
 * Detects cycles in a directed graph using Depth-First Search.
 * @param nodes The nodes of the graph.
 * @param links The directed edges of the graph.
 * @returns An array of cycles found in the graph.
 */
function detectCycles(nodes: { id: string }[], links: { source: string; target: string }[]): Cycle[] {
  const adjList = new Map<string, string[]>();
  const allCycles: Cycle[] = [];
  const foundCycles = new Set<string>(); // Stores a unique key for each found cycle to prevent duplicates.

  // 1. Build an adjacency list for efficient traversal.
  links.forEach(link => {
    if (!adjList.has(link.source)) {
      adjList.set(link.source, []);
    }
    adjList.get(link.source)!.push(link.target);
  });

  // 2. Iterate through each node and perform DFS to find cycles.
  for (const node of nodes) {
    const visiting = new Set<string>(); // Nodes currently in the recursion stack for the current DFS path.
    const path: string[] = []; // The current path of nodes being explored.
    dfs(node.id, visiting, path);
  }

  function dfs(nodeId: string, visiting: Set<string>, path: string[]) {
    visiting.add(nodeId);
    path.push(nodeId);

    const neighbors = adjList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      // If we find a neighbor that is already in the 'visiting' set, we have found a cycle.
      if (visiting.has(neighbor)) {
        const cycleStartIndex = path.indexOf(neighbor);
        const cycleNodes = path.slice(cycleStartIndex);

        // To avoid duplicates, create a sorted, canonical representation of the cycle.
        const canonicalCycleKey = cycleNodes.slice().sort().join(',');
        if (!foundCycles.has(canonicalCycleKey)) {
          const cycleLinks = [];
          for (let i = 0; i < cycleNodes.length; i++) {
            cycleLinks.push({
              source: cycleNodes[i],
              target: cycleNodes[(i + 1) % cycleNodes.length] // Connect back to the start
            });
          }
          allCycles.push({ nodes: cycleNodes, links: cycleLinks });
          foundCycles.add(canonicalCycleKey);
        }
        continue; // Continue searching for other cycles from this path.
      }
      dfs(neighbor, visiting, path);
    }

    // Backtrack: Once we have explored all neighbors, remove the current node from the visiting set and path.
    visiting.delete(nodeId);
    path.pop();
  }

  return allCycles;
}

// --- NEW FUNCTION: detectCycles ENDS HERE ---


const excludedPatterns = [
  /\.config\.js$/,
  /\.json$/,
  /\.env.*$/,
  /\.md$/,
  /\.gitignore$/,
  /\.gitattributes$/,
  /public\/index\.html$/,
  /\.css$/,
  /esbuild\.js$/,
  /tailwind\.config\.js$/,
  /webpack\.config\.js$/,
  /babel\.config\.js$/,
  /postcss\.config\.js$/,
  /jest\.config\.js$/,
  /prettierrc$/,
  /eslint$/,
  /^vscode$/,
  /^microsoft$/,
];

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
          if (node.type === "ImportDeclaration") {
            importPath = node.source.value;
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
        extensions: [".js", ".jsx", ".ts", ".tsx", ".ejs", ".mjs", ".html"],
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

