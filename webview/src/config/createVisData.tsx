import { type Data} from 'vis-network/standalone';
import type { EnhancedGraphData } from '../../../src/types/enhancedgraphdata.interface';

/**
 * Creates the data object for the vis-network graph.
 * @param filteredGraphData The filtered graph data to be displayed.
 * @param allGraphData The complete graph data, used for cycle information.
 * @param showCycles A boolean indicating whether to highlight cycles.
 * @returns The vis-network Data object.
 */
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
    const relativePath = node.id;
    const pathParts = relativePath.split('/');
    const group = pathParts.length > 1 ? pathParts[0] : 'root';
    const isCycleNode = cycleNodeIds.has(node.id);

    return {
      id: node.id,
      label: node.id.length > 20 ? `${node.id.substring(0, 20)}...` : node.id,
      title: node.id,
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