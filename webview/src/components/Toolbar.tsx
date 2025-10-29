import React, { useState } from "react";
import '../styles/Toolbar.css'

import {
  TbFocusCentered,
  TbRepeat,
  TbFileOff,
  TbFileExport,
} from "react-icons/tb";
// --- 1. IMPORT YOUR LOGO ---
import logo from '../assets/logo.png';

// Define the props that the Toolbar component will receive
interface ToolbarProps {
  // ... (all your props remain the same)
  allNodeIds: string[];
  onSearch: (query: string) => void;
  fitNetwork: () => void;
  handleDetectCycles: () => void;
  showCycles: boolean;
  handleDetectOrphans: () => void;
  showOrphans: boolean;
  handleExportGraph: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  allNodeIds,
  onSearch,
  fitNetwork,
  handleDetectCycles,
  showCycles,
  handleDetectOrphans,
  showOrphans,
  handleExportGraph,
}) => {
  // ... (all your state and handlers remain the same)
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length > 0) {
      const filteredSuggestions = allNodeIds
        .filter((id) => id.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 10);
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setSuggestions([]);
    onSearch(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setSuggestions([]);
      onSearch(query);
    }
  };

  return (
    <>
      <div className="toolbar">
        <div className="project-name">
          <img src={logo} alt="Dependo Logo" className="project-logo" width="190px" height="60px"/>
        </div>
        <div className="toolbar-controls">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by file name..."
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="search-input"
            />
            {suggestions.length > 0 && (
              <ul className="suggestions-list">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* --- 3. MODIFIED BUTTONS (ICON + SPAN) --- */}

          <button
            className="control-button"
            onClick={fitNetwork}
            title="Fit View"
            aria-label="Fit View"
          >
            <TbFocusCentered size={20} />
            <span>Fit View</span>
          </button>

          <button
            className={`control-button ${showCycles ? "active" : ""}`}
            onClick={handleDetectCycles}
            title={showCycles ? "Hide Cycles" : "Detect Cycles"}
            aria-label={showCycles ? "Hide Cycles" : "Detect Cycles"}
          >
            <TbRepeat size={20} />
            {/* The label text is now dynamic */}
            <span>{showCycles ? "Hide" : "Cycles"}</span>
          </button>

          <button
            className={`control-button ${showOrphans ? "active" : ""}`}
            onClick={handleDetectOrphans}
            title={showOrphans ? "Hide Orphan Files" : "Detect Orphan Files"}
            aria-label={
              showOrphans ? "Hide Orphan Files" : "Detect Orphan Files"
            }
          >
            <TbFileOff size={20} />
            {/* The label text is now dynamic */}
            <span>{showOrphans ? "Hide" : "Orphans"}</span>
          </button>

          <button
            className="control-button"
            onClick={handleExportGraph}
            title="Export Graph"
            aria-label="Export Graph"
          >
            <TbFileExport size={20} />
            <span>Export</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Toolbar;