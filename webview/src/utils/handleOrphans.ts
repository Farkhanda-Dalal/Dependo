import React from 'react';
import type { EnhancedGraphData } from '../../../src/types/enhancedgraphdata.interface';

export const handleDetectOrphans = (
  allGraphData: EnhancedGraphData,
  showOrphans: boolean,
  setShowOrphans: React.Dispatch<React.SetStateAction<boolean>>,
  setFilteredGraphData: React.Dispatch<React.SetStateAction<EnhancedGraphData>>
) => {
  console.log('--- handleDetectOrphans called ---');
  console.log('Current showOrphans state:', showOrphans);

  if (showOrphans) {
    console.log('Hiding orphans.');
    setShowOrphans(false);
    return;
  }

  console.log('Attempting to detect orphans...');
  
  const { nodes, links } = allGraphData;
  console.log(`Total nodes in allGraphData: ${nodes.length}`);
  console.log(`Total links in allGraphData: ${links.length}`);

  if (nodes.length === 0) {
    console.error('No nodes found in allGraphData. Cannot detect orphans.');
    alert('Project graph data is empty. Cannot detect orphans.');
    return;
  }

  const connectedNodeIds = new Set<string | number>();
  links.forEach(link => {
    connectedNodeIds.add(link.source);
    connectedNodeIds.add(link.target);
  });

  console.log(`Found ${connectedNodeIds.size} connected nodes.`);

  const orphanNodes = nodes.filter(node => !connectedNodeIds.has(node.id));
  const orphanNodeIds = orphanNodes.map(node => node.id);

  console.log(`Detected ${orphanNodeIds.length} orphan files.`);
  if (orphanNodeIds.length > 0) {
    console.log('Orphan file IDs:', orphanNodeIds);
  }

  if (orphanNodeIds.length === 0) {
    console.log('No orphan files found. Displaying alert.');
    alert("No orphan files found in the project.");
    return;
  }

  console.log('Orphans found. Resetting graph filter to show all nodes.');
  setFilteredGraphData(allGraphData);
  
  console.log('Setting showOrphans to true to trigger highlighting.');
  setShowOrphans(true);
};