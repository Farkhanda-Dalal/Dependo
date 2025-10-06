import React, { useState } from "react";
import '../styles/Toolbar.css'

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
  // State for the search query and suggestions
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Handler for input changes to update suggestions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length > 0) {
      const filteredSuggestions = allNodeIds
        .filter((id) => id.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 10); // Limit to 10 suggestions
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  // Handler for clicking a suggestion
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setSuggestions([]);
    onSearch(suggestion); // Trigger the search
  };

  // Handler for pressing Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setSuggestions([]);
      onSearch(query); // Trigger the search
    }
  };

  return (
    <>
      <div className="toolbar">
        <div className="project-name">
          <h1 className="text-xl font-bold">dependo</h1>
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
          <button className="control-button" onClick={fitNetwork}>
            🎯 Fit View
          </button>
          <button
            className={`control-button ${showCycles ? "active" : ""}`}
            onClick={handleDetectCycles}
          >
            🔍 {showCycles ? "Hide" : "Detect"} Cycles
          </button>
          <button
            className={`control-button ${showOrphans ? "active" : ""}`}
            onClick={handleDetectOrphans}
          >
            🗑️ {showOrphans ? "Hide" : "Detect"} Orphan Files
          </button>
          <button className="control-button" onClick={handleExportGraph}>
            Export Graph
          </button>
        </div>
      </div>
    </>
  );
};

export default Toolbar;

