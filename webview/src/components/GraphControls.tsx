// Define the props that this component will receive
interface GraphControlsProps {
  fitNetwork: () => void;
  handleDetectCycles: () => void;
  showCycles: boolean;
}

const GraphControls: React.FC<GraphControlsProps> = ({
  fitNetwork,
  handleDetectCycles,
  showCycles,
}) => {
  return (
    <div className="graph-controls">
      <button className="control-button" onClick={fitNetwork}>
        🎯 Fit View
      </button>
      <button
        className={`control-button ${showCycles ? 'active' : ''}`}
        onClick={handleDetectCycles}
      >
        🔍 {showCycles ? 'Hide' : 'Detect'} Cycles
      </button>
    </div>
  );
};

export default GraphControls;