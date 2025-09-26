import React from 'react';
import "../styles/Toolbar.css"

// Define the props that the Toolbar component will receive
interface ToolbarProps {
  handleSearch: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  fitNetwork: () => void;
  handleDetectCycles: () => void;
  showCycles: boolean;
  handleDetectOrphans: () => void;
  showOrphans: boolean;
  handleExportGraph: () => void; // Add the new prop here
}

const Toolbar: React.FC<ToolbarProps> = ({
  handleSearch,
  fitNetwork,
  handleDetectCycles,
  showCycles,
  handleDetectOrphans,
  showOrphans,
  handleExportGraph, // Destructure the new prop
}) => {
  return (
    <div className="toolbar">
      {/* Project name on the left */}
      <div className="project-name">
        <h1 className="text-xl font-bold">dependo</h1>
      </div>

      {/* Controls and search on the right */}
      <div className="toolbar-controls">
        <button className="control-button" onClick={fitNetwork}>
          🎯 Fit View
        </button>
        <button
          className={`control-button ${showCycles ? 'active' : ''}`}
          onClick={handleDetectCycles}
        >
          🔍 {showCycles ? 'Hide' : 'Detect'} Cycles
        </button>
        <button
          className={`control-button ${showOrphans ? 'active' : ''}`}
          onClick={handleDetectOrphans}
        >
          🗑️ {showOrphans ? 'Hide' : 'Detect'} Orphan Files
        </button>
        {/* Add the onClick handler to the export button */}
        <button className="control-button" onClick={handleExportGraph}>
          Export Graph
        </button>
        
        {/* Search bar is the rightmost element */}
        <input
          type="text"
          placeholder="Search by file name..."
          onKeyDown={handleSearch}
          className="search-input"
        />
      </div>
    </div>
  );
};

export default Toolbar;