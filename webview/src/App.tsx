import { useEffect, useState, useRef, useMemo } from "react"; // 1. IMPORT useMemo
import { Network, type Node } from "vis-network/standalone";
import { DataSet } from "vis-data/standalone";
import type { EnhancedGraphData } from "../../src/types/enhancedgraphdata.interface";
import "./App.css";

import Toolbar from "./components/Toolbar";
import GraphStats from "./components/GraphStats";
import LoadingState from "./components/LoadingState";
import EmptyProject from "./components/EmptyProject";
import Sidebar from "./components/Sidebar";
import CycleDetails from "./components/CycleDetails";

// 2. CHANGE the import to 'performSearch'
import { performSearch } from "./utils/handleSearch";
import { handleDetectCycles } from "./utils/handleDetectCycles";
import { handleFolderClick } from "./utils/handleFolderClick";
import { handleDetectOrphans } from "./utils/handleOrphans";

import { createVisOptions } from "./config/createVisOptions";
import { createVisData } from "./config/createVisData";

interface VscodeApi {
  postMessage(message: unknown): void;
}

type SavedNodeOptions = Pick<Node, "color" | "font">;

declare global {
  interface Window {
    acquireVsCodeApi: () => VscodeApi;
  }
}

function App() {
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
  const [showOrphans, setShowOrphans] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const networkRef = useRef<Network | null>(null);
  const nodesDataSetRef = useRef<DataSet<Node> | null>(null);
  const originalNodeOptionsRef = useRef<
    Record<string | number, SavedNodeOptions>
  >({});

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
      const options = createVisOptions(filteredGraphData);
      const network = new Network(containerRef.current, networkData, options);
      networkRef.current = network;
      network.on("stabilizationIterationsDone", () => {
        network.setOptions({ physics: false });
      });
      network.fit({ animation: false });
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

  useEffect(() => {
    const network = networkRef.current;
    if (!network) return;
    if (showCycles && allGraphData.cycles.length > 0) {
      const cycleNodeIds = [
        ...new Set(allGraphData.cycles.flatMap((cycle) => cycle.nodes)),
      ];
      if (cycleNodeIds.length > 0) {
        network.fit({ nodes: cycleNodeIds, animation: true });
      }
    }
  }, [showCycles, allGraphData.cycles]);

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
        color: { background: "#ff4136", border: "#ff4136" },
        font: { color: "#ffffff" },
      }));
      if (updatedNodes.length > 0) {
        nodesDataSet.update(updatedNodes);
      }
      if (orphanNodeIds.length > 0) {
        network.fit({ nodes: orphanNodeIds, animation: true });
      }
    } else {
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
  }, [showOrphans, allGraphData, filteredGraphData]);

  // 3. CREATE the allNodeIds list for autocomplete suggestions
  const allNodeIds = useMemo(
    () => allGraphData.nodes.map((node) => node.id),
    [allGraphData.nodes]
  );

  // 4. CREATE a new search handler that calls performSearch
  const runSearch = (query: string) => {
    performSearch(query, allGraphData, setFilteredGraphData);
  };

  const fitNetwork = () => {
    if (networkRef.current) {
      networkRef.current.fit({ animation: false });
    }
  };

  const handleExportGraph = () => {
    const network = networkRef.current;
    if (!network) return;
    const container = containerRef.current;
    const canvas = container?.querySelector("canvas");
    if (!canvas) return;
    const dataURL = (canvas as HTMLCanvasElement).toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "dependency-graph.png";
    link.click();
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
      {/* 5. UPDATE the props passed to Toolbar */}
      <Toolbar
        allNodeIds={allNodeIds}
        onSearch={runSearch}
        fitNetwork={fitNetwork}
        handleDetectCycles={() =>
          handleDetectCycles(allGraphData, showCycles, setShowCycles)
        }
        showCycles={showCycles}
        handleDetectOrphans={() =>
          handleDetectOrphans(
            allGraphData,
            showOrphans,
            setShowOrphans,
            setFilteredGraphData
          )
        }
        showOrphans={showOrphans}
        handleExportGraph={handleExportGraph}
      />
      <div className="content-container">
        <Sidebar
          folders={folders}
          onFolderClick={(folderPath) =>
            handleFolderClick(folderPath, allGraphData, setFilteredGraphData)
          }
        />
        <div className="main-content">
          <CycleDetails cycles={allGraphData.cycles} show={showCycles} />
          <GraphStats nodeCount={nodeCount} edgeCount={edgeCount} />
          <div ref={containerRef} className="graph-container"></div>
        </div>
      </div>
    </div>
  );
}

export default App;