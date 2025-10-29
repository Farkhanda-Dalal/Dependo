import { useEffect, useRef } from 'react';
import { Network, type Node } from 'vis-network/standalone';
import { DataSet } from 'vis-data/standalone';
// REFACTOR: Corrected relative path to types
import type { EnhancedGraphData } from '../../../src/types/enhancedgraphdata.interface';
// 1. Import GraphData instead of the non-existent LinkData
import type { GraphData } from '../../../src/types/graphdata.interface';
import { createVisData } from '../config/createVisData';
import { createVisOptions } from '../config/createVisOptions';

// 2. Define our Link type
type Link = GraphData['links'][number];

export const useVisNetwork = (
  containerRef: React.RefObject<HTMLDivElement>,
  filteredGraphData: EnhancedGraphData,
  allGraphData: EnhancedGraphData,
  showCycles: boolean,
  // 3. Use the corrected 'Link' type for the handler
  onEdgeClick: (edge: Link) => void,
  onClearSelection: () => void
) => {
  const networkRef = useRef<Network | null>(null);
  const nodesDataSetRef = useRef<DataSet<Node> | null>(null);

  useEffect(() => {
    // Check if the container is ready and there's data to render
    if (containerRef.current && filteredGraphData.nodes.length > 0) {
      
      // 1. Call createVisData to get nodes/edges
      const data = createVisData(filteredGraphData, allGraphData, showCycles);
      // We'll still use data.nodes, as it has highlighting logic
      const nodes = Array.isArray(data.nodes) ? data.nodes : [];

      // BUG FIX: data.edges is stripping the 'specifiers' property.
      // We will IGNORE data.edges and build our own from filteredGraphData.links,
      // which we know is complete.
      //
      const edgeIdMap = new Map<string, Link>();
      const edgesWithIds = filteredGraphData.links.map((link, index) => {
        const id = `edge-${index}`;
        
        // 'link' is the full, correct object from our backend
        edgeIdMap.set(id, link); // Store the *correct* data in the map

        // Return the object vis.js needs
        return {
          ...link, // This includes source, target, and specifiers
          id: id,
          from: link.source, // Explicitly provide 'from' and 'to' for vis.js
          to: link.target,
        };
      });

      const nodesDataSet = new DataSet(nodes);
      // Use our new, correct edgesWithIds array
      const edgesDataSet = new DataSet(edgesWithIds);
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

      // 5. Add new listeners for edge clicks
      network.on('selectEdge', (params) => {
        if (params.edges.length > 0) {
          const edgeId = params.edges[0];
          const clickedEdgeData = edgeIdMap.get(edgeId); // Use our map
          if (clickedEdgeData) {
            onEdgeClick(clickedEdgeData); // Pass the original data up to App.tsx
          }
        }
      });

      network.on('deselectEdge', () => {
        onClearSelection(); // Tell App.tsx to clear the panel
      });
      
      // Also clear selection if user clicks on empty space
      network.on('click', (params) => {
        if (params.nodes.length === 0 && params.edges.length === 0) {
          onClearSelection();
        }
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
  }, [
    filteredGraphData,
    showCycles,
    allGraphData,
    containerRef,
    onEdgeClick,
    onClearSelection,
  ]);

  // Return the refs, just as App.tsx expects
  return { networkRef, nodesDataSetRef };
};