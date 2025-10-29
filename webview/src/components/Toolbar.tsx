import React, { useState, useEffect } from "react";
import '../styles/Toolbar.css'
import logo from '../assets/logo.png';
import { useDebounce } from '../hooks/useDebounce';


import {
  TbFocusCentered,
  TbRepeat,
  TbFileOff,
  TbFileExport,
} from "react-icons/tb";

// Define the props that the Toolbar component will receive
interface ToolbarProps {
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
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // REFACTOR: Create a debounced version of the query.
  // The filtering logic will use this value.
  const debouncedQuery = useDebounce(query, 250); // 250ms delay

  // REFACTOR: The input handler is now very simple.
  // It only updates the query state, which is fast.
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  // REFACTOR: The expensive filtering logic is moved into a useEffect
  // that runs *only* when the debouncedQuery changes.
  useEffect(() => {
    if (debouncedQuery.length > 0) {
      const filteredSuggestions = allNodeIds
        // Use the debouncedQuery for filtering
        .filter((id) => id.toLowerCase().includes(debouncedQuery.toLowerCase()))
        .slice(0, 10);
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
    // This effect now depends on the debounced value, not the instant query
  }, [debouncedQuery, allNodeIds]);

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setSuggestions([]);
    onSearch(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setSuggestions([]);
      // We use the *immediate* query here so "Enter" feels instant
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