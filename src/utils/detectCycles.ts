import { Cycle } from "../types/cycle.interface";

/**
 * Detects cycles in a directed graph using Depth-First Search.
 * @param nodes The nodes of the graph.
 * @param links The directed edges of the graph.
 * @returns An array of cycles found in the graph.
 */

export function detectCycles(
  nodes: { id: string }[],
  links: { source: string; target: string; specifiers?: string[] }[]
): Cycle[] {
  const adjList = new Map<string, string[]>();
  const allCycles: Cycle[] = [];
  const foundCycles = new Set<string>(); // Stores a unique key for each found cycle to prevent duplicates.

  // 1. Build an adjacency list for efficient traversal.
  links.forEach((link) => {
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
        const canonicalCycleKey = cycleNodes.slice().sort().join(",");
        if (!foundCycles.has(canonicalCycleKey)) {
          const cycleLinks = [];
          for (let i = 0; i < cycleNodes.length; i++) {
            const source = cycleNodes[i];
            const target = cycleNodes[(i + 1) % cycleNodes.length];
            // Find the original link to get specifiers
            const originalLink = links.find(
              (l) => l.source === source && l.target === target
            );
            cycleLinks.push({
              source: source,
              target: target, // Connect back to the start
              specifiers: originalLink?.specifiers,
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