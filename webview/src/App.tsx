import { useEffect, useState, useRef } from "react";
import { Network } from "vis-network/standalone";
import type { EnhancedGraphData } from '../../src/types/enhancedgraphdata.interface';
import "./App.css";

// Import the new components
import GraphHeader from "./components/GraphHeader";
import GraphControls from "./components/GraphControls";
import GraphStats from "./components/GraphStats";

// Import the existing components
import LoadingState from "./components/LoadingState";
import EmptyProject from "./components/EmptyProject";
import Sidebar from "./components/Sidebar";
import CycleDetails from "./components/CycleDetails";

// Import the handler functions from the new utils file
import { handleSearch } from "./utils/handleSearch";
import { handleDetectCycles } from "./utils/handleDetectCycles";
import { handleFolderClick } from "./utils/handleFolderClick";

// Import the new configuration functions
import { createVisOptions } from "./config/createVisOptions";
import { createVisData } from "./config/createVisData";

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
  //useState
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
  const [showCycles, setShowCycles] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const networkRef = useRef<Network | null>(null);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch("http://localhost:3001/api/graph").then((res) => res.json()),
      fetch("http://localhost:3001/api/folders").then((res) => res.json()),
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
  }, []);

  useEffect(() => {
    if (containerRef.current && filteredGraphData.nodes.length > 0) {
      // Use the new functions to create the data and options
      const visData = createVisData(filteredGraphData, allGraphData, showCycles);
      const options = createVisOptions(filteredGraphData);
      
      const network = new Network(containerRef.current, visData, options);
      networkRef.current = network;

      network.on("stabilizationIterationsDone", () => {
        network.setOptions({ physics: false });
      });

      network.fit();

      const canvas = containerRef.current;
      network.on("hoverNode", () => {
        if (canvas) canvas.style.cursor = "pointer";
      });
      network.on("blurNode", () => {
        if (canvas) canvas.style.cursor = "grab";
      });
      network.on("dragStart", () => {
        if (canvas) canvas.style.cursor = "grabbing";
      });
      network.on("dragEnd", () => {
        if (canvas) canvas.style.cursor = "grab";
      });

      if (canvas) canvas.style.cursor = "grab";
    }
  }, [filteredGraphData, showCycles, allGraphData.cycles]);

    const fitNetwork = () => {
    if (networkRef.current) {
      networkRef.current.fit();
    }
  };


  const nodeCount = filteredGraphData.nodes.length;
  const edgeCount = filteredGraphData.links.length;

  if (isLoading) {
    return <LoadingState />;
  }

  if (nodeCount === 0 && edgeCount === 0) {
    return <EmptyProject />;
  }

  return (
    <div className="app-container">
      <Sidebar folders={folders} onFolderClick={(folderPath) => handleFolderClick(folderPath, allGraphData, setFilteredGraphData)} />
      <div className="main-content">
        <CycleDetails cycles={allGraphData.cycles} show={showCycles} />
        <div className="graph-panel">
          <GraphHeader
            handleSearch={(e) => handleSearch(e, allGraphData, setFilteredGraphData)}
          />
          <GraphControls
            fitNetwork={fitNetwork}
            handleDetectCycles={() => handleDetectCycles(allGraphData, showCycles, setShowCycles)}
            showCycles={showCycles}
          />
        </div>
        <GraphStats
          nodeCount={nodeCount}
          edgeCount={edgeCount}
          cycleCount={allGraphData.cycles.length}
        />
        <div ref={containerRef} className="graph-container"></div>
      </div>
    </div>
  );
}

export default App;
