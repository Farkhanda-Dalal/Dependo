import { useEffect, useRef } from 'react';
import type { Network, Node } from 'vis-network/standalone';
import type { DataSet } from 'vis-data/standalone';
import type { EnhancedGraphData } from '../../../src/types/enhancedgraphdata.interface';

type SavedNodeOptions = Pick<Node, 'color' | 'font'>;

/**
 * Custom hook to highlight or un-highlight orphan nodes.
 */
export const useOrphanHighlighting = (
  nodesDataSetRef: React.RefObject<DataSet<Node> | null>,
  networkRef: React.RefObject<Network | null>,
  showOrphans: boolean,
  allGraphData: EnhancedGraphData
) => {
  // This ref now lives inside the custom hook, completely encapsulated
  const originalNodeOptionsRef = useRef<
    Record<string | number, SavedNodeOptions>
  >({});

  useEffect(() => {
    const nodesDataSet = nodesDataSetRef.current;
    const network = networkRef.current;
    if (!nodesDataSet || !network || !allGraphData) return;

    const { nodes, links } = allGraphData;
    const connectedNodeIds = new Set(
      links.flatMap((link) => [link.source, link.target])
    );
    const orphanNodeIds = nodes
      .filter((node) => !connectedNodeIds.has(node.id))
      .map((node) => node.id);

    if (showOrphans) {
      const originalNodeData = nodesDataSet.get(orphanNodeIds);
      const originalOptions: Record<string | number, SavedNodeOptions> = {};

      originalNodeData.forEach((node) => {
        originalOptions[node.id] = {
          color: JSON.parse(JSON.stringify(node.color ?? null)),
          font: JSON.parse(JSON.stringify(node.font ?? null)),
        };
      });
      originalNodeOptionsRef.current = originalOptions;

      const updatedNodes = orphanNodeIds.map((id) => ({
        id,
        color: { background: '#ff4136', border: '#ff4136' },
        font: { color: '#ffffff' },
      }));

      if (updatedNodes.length > 0) {
        nodesDataSet.update(updatedNodes);
      }
      if (orphanNodeIds.length > 0) {
        network.fit({ nodes: orphanNodeIds, animation: true });
      }
    } else {
      // Revert nodes if showOrphans is turned off
      const nodesToRevert = Object.keys(originalNodeOptionsRef.current).map(
        (id) => ({
          id,
          ...originalNodeOptionsRef.current[id],
        })
      );
      if (nodesToRevert.length > 0) {
        nodesDataSet.update(nodesToRevert);
        originalNodeOptionsRef.current = {};
      }
    }
  }, [showOrphans, allGraphData, nodesDataSetRef, networkRef]);
};

