import { useEffect, useState, useRef } from 'react';
import { Network, type Data } from 'vis-network/standalone';
import type { GraphData } from '../../src/parser';

// Create a specific type for the VS Code API
interface VscodeApi {
  postMessage(message: unknown): void;
}

declare global {
  interface Window {
    acquireVsCodeApi: () => VscodeApi;
  }
}

function App() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/graph')
      .then(response => response.json())
      .then((data: GraphData) => {
        setGraphData(data);
      });
  }, []);

  useEffect(() => {
    if (containerRef.current && graphData.nodes.length > 0) {
      // Correctly map our GraphData to vis-network's Data type
      const visData: Data = {
        nodes: graphData.nodes.map(node => ({ id: node.id, label: node.id })),
        edges: graphData.links.map(link => ({ from: link.source, to: link.target })),
      };
      
      const options = {};
      new Network(containerRef.current, visData, options);
    }
  }, [graphData]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100vh' }}></div>
  );
}

export default App;