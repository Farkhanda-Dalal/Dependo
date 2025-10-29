// 1. Import GraphData
import type { GraphData } from '../../../src/types/graphdata.interface';
import '../styles/ImportDetails.css'

// 2. Define our Link type
type Link = GraphData['links'][number];

interface ImportDetailsProps {
  // 3. Use the corrected 'Link' type
  edge: Link;
  onClose: () => void;
}

function ImportDetails({ edge, onClose }: ImportDetailsProps) {
  
  const getSpecifierString = (): string => {
    if (!edge.specifiers || edge.specifiers.length === 0) {
      return "module"; 
    }
    // This will join specifiers, e.g., "funcA, funcB" or just "ProductList (default)"
    return edge.specifiers.join(', ');
  };

  const specifierString = getSpecifierString();

  return (
    <div className="import-details-panel">
      <div className="import-details-header">
        <h3>Import Details</h3>
        <button onClick={onClose} className="import-details-close-btn" title="Close">
          &times;
        </button>
      </div>

      <div className="import-sentence">
        <code className="import-path-source">{edge.source}</code>
        <span className="import-verb"> imports </span>
        <code className="import-specifier">{specifierString}</code>
        <span className="import-verb"> from </span>
        <code className="import-path-target">{edge.target}</code>
      </div>

    </div>
  );
}

export default ImportDetails;