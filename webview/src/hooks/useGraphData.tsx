import { useState, useEffect } from 'react';
import type { EnhancedGraphData } from '../../../src/types/enhancedgraphdata.interface';

/**
 * Custom hook to fetch and manage the core graph and folder data.
 */
export const useGraphData = () => {
  const [allGraphData, setAllGraphData] = useState<EnhancedGraphData>({
    nodes: [],
    links: [],
    cycles: [],
  });
  const [filteredGraphData, setFilteredGraphData] = useState<EnhancedGraphData>(
    {
      nodes: [],
      links: [],
      cycles: [],
    }
  );
  const [isLoading, setIsLoading] = useState(true);
  const [folders, setFolders] = useState({});

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch('http://localhost:3001/api/graph').then((res) => res.json()),
      fetch('http://localhost:3001/api/folders').then((res) => res.json()),
    ])
      .then(([graphData, folderData]) => {
        setAllGraphData(graphData);
        setFilteredGraphData(graphData);
        setFolders(folderData);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []); // Empty dependency array means this runs once on mount

  return {
    allGraphData,
    filteredGraphData,
    setFilteredGraphData,
    folders,
    isLoading,
  };
};
