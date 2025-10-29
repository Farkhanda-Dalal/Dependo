import { useState, useRef, useMemo, useCallback } from 'react';
import './App.css';

// Component Imports
import Toolbar from './components/Toolbar';
import GraphStats from './components/GraphStats';
import LoadingState from './components/LoadingState';
import EmptyProject from './components/EmptyProject';
import Sidebar from './components/Sidebar';
import CycleDetails from './components/CycleDetails';

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

  // --- Refs ---
  // Ref for the DOM container
  const containerRef = useRef<HTMLDivElement>(null!);

  // Refs for network and nodes are now managed by the useVisNetwork hook
  const { networkRef, nodesDataSetRef } = useVisNetwork(
    containerRef,
    filteredGraphData,
    allGraphData,
    showCycles
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
  // These are unchanged, as their logic and dependencies remain the same.
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
  // This logic is completely unchanged.
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
      {/* Props passed to components are unchanged */}
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
          <GraphStats nodeCount={nodeCount} edgeCount={edgeCount} />
          {/* The container ref is attached here, as before */}
          <div ref={containerRef} className="graph-container"></div>
        </div>
      </div>
    </div>
  );
}

export default App;

