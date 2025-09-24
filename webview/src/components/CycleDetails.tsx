import React from "react";
import type { Cycle } from "../../../src/types/cycle.interface";
import "../styles/CycleDetails.css"

interface CycleDetailsProps {
  cycles: Cycle[];
  show: boolean;
}

const CycleDetails: React.FC<CycleDetailsProps> = ({ cycles, show }) => {
  if (!show || cycles.length === 0) {
    return null;
  }

  return (
    <div className="cycle-details-panel">
      <h3 className="cycle-details-title">Detected Circular Dependencies</h3>
      <div className="cycle-details-list">
        {cycles.map((cycle, index) => (
          <div key={index} className="cycle-item">
            <div className="cycle-item-header">Cycle #{index + 1}</div>
            <ul className="cycle-path">
              {cycle.links.map((link, linkIndex) => (
                <li key={linkIndex}>
                  <span className="cycle-node">{link.source}</span> imports{" "}
                  <span className="specifiers">
                    {link.specifiers?.join(", ") || "module"}
                  </span>{" "}
                  from <span className="cycle-node">{link.target}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CycleDetails;
