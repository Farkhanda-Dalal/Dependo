import { useState, useRef, useMemo, useCallback } from 'react';
import './App.css';

// Component Imports
import Toolbar from './components/Toolbar';
import GraphStats from './components/GraphStats';
import LoadingState from './components/LoadingState';
import EmptyProject from './components/EmptyProject';
import Sidebar from './components/Sidebar';
import CycleDetails from './components/CycleDetails';
import ImportDetails from './components/ImportDetails';
// 1. Import GraphData from its correct location (assuming path from useVisNetwork)
import type { GraphData } from '../../src/types/graphdata.interface';

// Utility Imports
import { performSearch } from './utils/handleSearch';
import { handleDetectCycles } from './utils/handleDetectCycles';
import { handleFolderClick } from './utils/handleFolderClick';
import { handleDetectOrphans } from './utils/handleOrphans';

// --- Custom Hook Imports ---
import { useGraphData } from './hooks/useGraphData';
import { useVisNetwork } from './hooks/useVisNetwork';
import { useCycleFitting } from './hooks/useCycleFitting';
import { useOrphanHighlighting } from './hooks/useOrphanHighlighting';

interface VscodeApi {
  postMessage(message: unknown): void;
}

declare global {
  interface Window {
    acquireVsCodeApi: () => VscodeApi;
  }
}

// 2. Define our Link type using GraphData
type Link = GraphData['links'][number];

function App() {
  // --- State Definitions ---
  // Core data state is now managed by our custom hook
  const {
    allGraphData,
    filteredGraphData,
    setFilteredGraphData,
    folders,
    isLoading,
  } = useGraphData();

  // Local state for UI toggles remains in App
  const [showCycles, setShowCycles] = useState(false);
  const [showOrphans, setShowOrphans] = useState(false);

  // 3. Use our corrected 'Link' type
  const [selectedEdge, setSelectedEdge] = useState<Link | null>(null);

  // --- Refs ---
  // Ref for the DOM container
  const containerRef = useRef<HTMLDivElement>(null!);

  // 4. Define the handlers *before* they are used in the hook
  const onEdgeClick = useCallback((edge: Link) => {
    setSelectedEdge(edge);
  }, []); // setSelectedEdge is stable, no dependency needed

  const onClearSelection = useCallback(() => {
    setSelectedEdge(null);
  }, []); // No dependencies

  // Refs for network and nodes are now managed by the useVisNetwork hook
  const { networkRef, nodesDataSetRef } = useVisNetwork(
    containerRef,
    filteredGraphData,
    allGraphData,
    showCycles,
    onEdgeClick,
    onClearSelection
  );

  // --- Custom Hook Effects ---
  // Effect for fitting cycles
  useCycleFitting(networkRef, showCycles, allGraphData.cycles);

  // Effect for highlighting orphans
  useOrphanHighlighting(nodesDataSetRef, networkRef, showOrphans, allGraphData);

  // --- MEMOIZED VALUES ---
  const allNodeIds = useMemo(
    () => allGraphData.nodes.map((node) => node.id),
    [allGraphData.nodes]
  );

  // --- STABLE EVENT HANDLERS (useCallback) ---
  const runSearch = useCallback(
    (query: string) => {
      performSearch(query, allGraphData, setFilteredGraphData);
    },
    [allGraphData] // setFilteredGraphData is stable
  );

  const fitNetwork = useCallback(() => {
    if (networkRef.current) {
      networkRef.current.fit({ animation: false });
    }
  }, [networkRef]); // Dependency on ref object is stable

  const handleExportGraph = useCallback(() => {
    const network = networkRef.current;
    if (!network) return;
    const container = containerRef.current;
    const canvas = container?.querySelector('canvas');
    if (!canvas) return;
    const dataURL = (canvas as HTMLCanvasElement).toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'dependency-graph.png';
    link.click();
  }, [networkRef, containerRef]); // Dependencies on ref objects are stable

  // (The handlers we moved were here)

  const onDetectCycles = useCallback(() => {
    handleDetectCycles(allGraphData, showCycles, setShowCycles);
  }, [allGraphData, showCycles]); // setShowCycles is stable

  const onDetectOrphans = useCallback(() => {
    handleDetectOrphans(
      allGraphData,
      showOrphans,
      setShowOrphans,
      setFilteredGraphData
    );
  }, [allGraphData, showOrphans]); // Setters are stable

  const onFolderClick = useCallback(
    (folderPath: string) => {
      handleFolderClick(folderPath, allGraphData, setFilteredGraphData);
    },
    [allGraphData] // setFilteredGraphData is stable
  );

  // --- RENDER LOGIC ---
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
      <Toolbar
        allNodeIds={allNodeIds}
        onSearch={runSearch}
        fitNetwork={fitNetwork}
        handleDetectCycles={onDetectCycles}
        showCycles={showCycles}
        handleDetectOrphans={onDetectOrphans}
        showOrphans={showOrphans}
        handleExportGraph={handleExportGraph}
      />
      <div className="content-container">
        <Sidebar folders={folders} onFolderClick={onFolderClick} />
        <div className="main-content">
          <CycleDetails cycles={allGraphData.cycles} show={showCycles} />

          {selectedEdge && (
            <ImportDetails
              edge={selectedEdge}
              onClose={() => setSelectedEdge(null)}
            />
          )}

          <GraphStats nodeCount={nodeCount} edgeCount={edgeCount} />
          <div ref={containerRef} className="graph-container"></div>
        </div>
      </div>
    </div>
  );
}

export default App;

