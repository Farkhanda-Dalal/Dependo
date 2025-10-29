import { useEffect, useRef } from 'react';
import { Network, type Node } from 'vis-network/standalone';
import { DataSet } from 'vis-data/standalone';
// REFACTOR: Corrected relative path to types
import type { EnhancedGraphData } from '../../../src/types/enhancedgraphdata.interface';
import { createVisData } from '../config/createVisData';
import { createVisOptions } from '../config/createVisOptions';

export const useVisNetwork = (
  containerRef: React.RefObject<HTMLDivElement>,
  filteredGraphData: EnhancedGraphData,
  allGraphData: EnhancedGraphData,
  showCycles: boolean
) => {
  const networkRef = useRef<Network | null>(null);
  const nodesDataSetRef = useRef<DataSet<Node> | null>(null);

  useEffect(() => {
    // Check if the container is ready and there's data to render
    if (containerRef.current && filteredGraphData.nodes.length > 0) {
      
      // 1. Call createVisData to get nodes/edges
      const data = createVisData(filteredGraphData, allGraphData, showCycles);
      const nodes = Array.isArray(data.nodes) ? data.nodes : [];
      const edges = Array.isArray(data.edges) ? data.edges : [];

      const nodesDataSet = new DataSet(nodes);
      const edgesDataSet = new DataSet(edges);
      nodesDataSetRef.current = nodesDataSet;

      const networkData = {
        nodes: nodesDataSet,
        edges: edgesDataSet,
      };

      // 2. Call createVisOptions to get the config
      const options = createVisOptions(filteredGraphData);
      
      // 3. Create the Network
      const network = new Network(containerRef.current, networkData, options);
      networkRef.current = network;

      // --- Event Listeners ---
      network.on('stabilizationIterationsDone', () => {
        network.setOptions({ physics: false });
      });

      network.fit({ animation: false });

      const canvas = containerRef.current;
      network.on('hoverNode', () => {
        if (canvas) canvas.style.cursor = 'pointer';
      });
      network.on('blurNode', () => {
        if (canvas) canvas.style.cursor = 'grab';
      });
      network.on('dragStart', () => {
        if (canvas) canvas.style.cursor = 'grabbing';
      });
      network.on('dragEnd', () => {
        if (canvas) canvas.style.cursor = 'grab';
      });
      if (canvas) canvas.style.cursor = 'grab';

      // Cleanup function
      return () => {
        if (networkRef.current) {
          networkRef.current.destroy();
          networkRef.current = null;
        }
      };
    }
  }, [filteredGraphData, showCycles, allGraphData, containerRef]);

  // Return the refs, just as App.tsx expects
  return { networkRef, nodesDataSetRef };
};