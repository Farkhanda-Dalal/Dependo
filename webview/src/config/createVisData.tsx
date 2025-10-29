import { type Data } from 'vis-network';
import type { EnhancedGraphData } from '../../../src/types/enhancedgraphdata.interface';

/**
 * Creates the data object for the vis-network graph.
 * @param filteredGraphData The filtered graph data to be displayed.
 * @param allGraphData The complete graph data, used for cycle information.
 * @param showCycles A boolean indicating whether to highlight cycles.
 * @returns The vis-network Data object.
 */
// REFACTOR: Renamed function back to createVisData
export const createVisData = (
  filteredGraphData: EnhancedGraphData,
  allGraphData: EnhancedGraphData,
  showCycles: boolean
): Data => {
  const cycleNodeIds = new Set(
    showCycles ? allGraphData.cycles.flatMap((c) => c.nodes) : []
  );
  const cycleLinkIds = new Set(
    showCycles
      ? allGraphData.cycles.flatMap((c) =>
          c.links.map((l) => `${l.source}->${l.target}`)
        )
      : []
  );

  const nodesWithGroups = filteredGraphData.nodes.map((node) => {
    const fullRelativePath = node.id; 
    const pathParts = fullRelativePath.split('/');

    // By default, the display path is the full path
    let displayPath = fullRelativePath;
    
    // If the path has more than one part (e.g., "rootFolder/file.js"),
    // slice off the first part (the root folder) for the display label.
    if (pathParts.length > 1) {
      displayPath = pathParts.slice(1).join('/'); // Becomes "Backend/services/..."
    }
    
    // Also, improved truncation to show the *end* of the file, which is more useful
    const label = displayPath.length > 20 
      ? `...${displayPath.substring(displayPath.length - 17)}` // e.g., "...ptain.service.js"
      : displayPath;

    const group = pathParts.length > 1 ? pathParts[0] : 'root';
    const isCycleNode = cycleNodeIds.has(node.id);

    return {
      id: node.id, // ID remains the full, unique path for logic
      label: label, // Use the new, cleaner label for display
      title: node.id, // Tooltip (on hover) still shows the full, correct path
      group,
      color: isCycleNode
        ? {
            background: '#fee2e2',
            border: '#ef4444',
            highlight: { background: '#fecaca', border: '#dc2626' },
            hover: { background: '#fee2e2', border: '#ef4444' },
          }
        : undefined,
    };
  });

  const visEdges = filteredGraphData.links.map((link) => {
    const isCycleLink = cycleLinkIds.has(`${link.source}->${link.target}`);
    return {
      from: link.source,
      to: link.target,
      color: isCycleLink
        ? {
            color: '#f87171',
            highlight: '#ef4444',
            hover: '#ef4444',
          }
        : undefined,
      width: isCycleLink ? 3 : 2,
    };
  });

  return {
    nodes: nodesWithGroups,
    edges: visEdges,
  };
};