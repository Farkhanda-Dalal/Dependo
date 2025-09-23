// App.tsx
import { useEffect, useState, useRef } from "react";
import { Network, type Data, type Options } from "vis-network/standalone";
import type { GraphData } from "../../src/parser";
import "./App.css";
import LoadingState from "./components/LoadingState";
import EmptyProject from "./components/EmptyProject";
import Sidebar from "./components/Sidebar";

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
  const [allGraphData, setAllGraphData] = useState<GraphData>({
    nodes: [],
    links: [],
  });
  const [filteredGraphData, setFilteredGraphData] = useState<GraphData>({
    nodes: [],
    links: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [folders, setFolders] = useState({});
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

  const fitNetwork = () => {
    if (networkRef.current) {
      networkRef.current.fit();
    }
  };

  const handleSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      const query = event.currentTarget.value.toLowerCase();
      if (query === "") {
        setFilteredGraphData(allGraphData);
      } else {
        const matchingNodes = allGraphData.nodes.filter((node) =>
          node.id.toLowerCase().includes(query)
        );
        const matchingNodeIds = new Set(matchingNodes.map((node) => node.id));

        const filteredLinks = allGraphData.links.filter(
          (link) =>
            matchingNodeIds.has(link.source) || matchingNodeIds.has(link.target)
        );

        const allRelatedNodeIds = new Set<string>();
        filteredLinks.forEach((link) => {
          allRelatedNodeIds.add(link.source);
          allRelatedNodeIds.add(link.target);
        });

        const filteredNodes = allGraphData.nodes.filter((node) =>
          allRelatedNodeIds.has(node.id)
        );

        setFilteredGraphData({ nodes: filteredNodes, links: filteredLinks });
      }
    }
  };

  const handleFolderClick = (folderPath: string) => {
    console.log("Folder Clicked:", folderPath);
    console.log(
      "All graph nodes:",
      allGraphData.nodes.map((n) => n.id)
    );

    // Normalize folder path - ensure it uses forward slashes
    const normalizedFolderPath = folderPath.replace(/\\/g, "/");
    const query =
      normalizedFolderPath === "root" ? "" : `${normalizedFolderPath}/`;
    console.log("Query string:", query);

    if (query === "") {
      setFilteredGraphData(allGraphData);
    } else {
      const matchingNodes = allGraphData.nodes.filter((node) => {
        const nodeId = node.id.toLowerCase();
        const queryLower = query.toLowerCase();
        console.log(
          `Checking if "${nodeId}" starts with "${queryLower}":`,
          nodeId.startsWith(queryLower)
        );
        return nodeId.startsWith(queryLower);
      });
      console.log("Nodes within folder:", matchingNodes);

      if (matchingNodes.length === 0) {
        console.log(
          "No direct matches found, checking for any nodes containing the folder path..."
        );
        // Try a more flexible search - find nodes that contain the folder path anywhere
        const flexibleMatchingNodes = allGraphData.nodes.filter((node) => {
          const nodeId = node.id.toLowerCase();
          const folderPathLower = normalizedFolderPath.toLowerCase();
          return nodeId.includes(folderPathLower);
        });

        if (flexibleMatchingNodes.length > 0) {
          console.log(
            "Found nodes with flexible matching:",
            flexibleMatchingNodes
          );
          const matchingNodeIds = new Set(
            flexibleMatchingNodes.map((node) => node.id)
          );
          const filteredLinks = allGraphData.links.filter(
            (link) =>
              matchingNodeIds.has(link.source) ||
              matchingNodeIds.has(link.target)
          );

          const allRelatedNodeIds = new Set<string>();
          filteredLinks.forEach((link) => {
            allRelatedNodeIds.add(link.source);
            allRelatedNodeIds.add(link.target);
          });

          const filteredNodes = allGraphData.nodes.filter((node) =>
            allRelatedNodeIds.has(node.id)
          );

          setFilteredGraphData({ nodes: filteredNodes, links: filteredLinks });
        } else {
          console.log("No nodes found even with flexible matching");
          setFilteredGraphData({ nodes: [], links: [] });
        }
        return;
      }

      const matchingNodeIds = new Set(matchingNodes.map((node) => node.id));
      const filteredLinks = allGraphData.links.filter(
        (link) =>
          matchingNodeIds.has(link.source) || matchingNodeIds.has(link.target)
      );

      const allRelatedNodeIds = new Set<string>();
      filteredLinks.forEach((link) => {
        allRelatedNodeIds.add(link.source);
        allRelatedNodeIds.add(link.target);
      });

      const filteredNodes = allGraphData.nodes.filter((node) =>
        allRelatedNodeIds.has(node.id)
      );

      setFilteredGraphData({ nodes: filteredNodes, links: filteredLinks });
    }
  };

  useEffect(() => {
    if (containerRef.current && filteredGraphData.nodes.length > 0) {
      // Collect all unique group names to configure their physics
      const uniqueGroups = new Set<string>();
      const nodesWithGroups = filteredGraphData.nodes.map((node) => {
        const relativePath = node.id;
        const pathParts = relativePath.split("/");
        const group = pathParts.length > 1 ? pathParts[0] : "root";
        uniqueGroups.add(group); // Add group to the set

        return {
          id: node.id,
          label:
            node.id.length > 20 ? node.id.substring(0, 20) + "..." : node.id,
          title: node.id,
          group: group,
        };
      });

      // Dynamically create group configurations for physics
      const groupPhysicsConfig: { [key: string]: { physics: boolean } } = {};
      uniqueGroups.forEach(g => {
        groupPhysicsConfig[g] = { physics: true }; // Enable physics per group
      });


      const visData: Data = {
        nodes: nodesWithGroups,
        edges: filteredGraphData.links.map((link) => ({
          from: link.source,
          to: link.target,
        })),
      };

      const options: Options = {
        layout: {
          improvedLayout: true,
        },
        physics: {
          enabled: true,
          barnesHut: {
            gravitationalConstant: -30000, // Increased repulsion
            centralGravity: 0.1, // Reduced pull to center
            springLength: 100,
            springConstant: 0.05,
            damping: 0.15,
            avoidOverlap: 1, // Maximize avoidance of overlap within clusters
          },
          minVelocity: 0.75,
          solver: "barnesHut",
        },
        nodes: {
          shape: "box",
          font: {
            color: "#374151",
            face: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            size: 14,
          },
          color: {
            background: "#f8fafc",
            border: "#0066cc",
            highlight: {
              background: "#dbeafe",
              border: "#2563eb",
            },
            hover: {
              background: "#eff6ff",
              border: "#3b82f6",
            },
          },
          margin: { top: 12, right: 16, bottom: 12, left: 16 },
          borderWidth: 2,
          borderWidthSelected: 3,
          shadow: {
            enabled: true,
            color: "rgba(37, 99, 235, 0.15)",
            size: 8,
            x: 0,
            y: 2,
          },
        },
        edges: {
          color: {
            color: "#60a5fa",
            highlight: "#2563eb",
            hover: "#3b82f6",
            inherit: false,
          },
          width: 2,
          widthConstraint: {
            maximum: 4,
          },
          font: {
            align: "middle",
            size: 12,
            color: "#1e40af",
            background: "#ffffff",
            strokeWidth: 3,
            strokeColor: "#ffffff",
          },
          arrows: {
            to: {
              enabled: true,
              scaleFactor: 1.2,
              type: "arrow",
            },
          },
          smooth: {
            enabled: true,
            type: "dynamic",
            roundness: 0.5,
          },
          shadow: {
            enabled: true,
            color: "rgba(59, 130, 246, 0.1)",
            size: 4,
            x: 0,
            y: 1,
          },
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
          hideEdgesOnDrag: false,
          hideNodesOnDrag: false,
          dragView: true,
          zoomView: true,
        },
        // Dynamically assign physics settings to groups
        groups: groupPhysicsConfig, 
        configure: {
          enabled: false,
        },
      };

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
  }, [filteredGraphData]);

  const nodeCount = filteredGraphData.nodes.length;
  const edgeCount = filteredGraphData.links.length;

  if (isLoading) {
    return <LoadingState></LoadingState>;
  }

  if (nodeCount === 0 && edgeCount === 0) {
    return <EmptyProject></EmptyProject>;
  }

  return (
    <div className="app-container">
      {/* The Sidebar component will go here */}
      <Sidebar folders={folders} onFolderClick={handleFolderClick} />

      <div className="main-content">
        <div className="graph-panel">
          <div className="graph-header">
            <h1 className="graph-title">Dependency Graph</h1>
            <p className="graph-subtitle">
              Visual representation of your project's dependencies
            </p>
            <input
              type="text"
              placeholder="Search by file name..."
              onKeyDown={handleSearch}
              className="search-input"
            />
          </div>

          <button className="control-button" onClick={fitNetwork}>
            🎯 Fit View
          </button>
        </div>

        <div className="graph-stats">
          <div className="stat-item">
            <div className="stat-value">{nodeCount}</div>
            <div className="stat-label">Files</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{edgeCount}</div>
            <div className="stat-label">Dependencies</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {edgeCount > 0
                ? Math.round((edgeCount / nodeCount) * 10) / 10
                : 0}
            </div>
            <div className="stat-label">Avg. Deps</div>
          </div>
        </div>

        <div ref={containerRef} className="graph-container"></div>
      </div>
    </div>
  );
}

export default App;