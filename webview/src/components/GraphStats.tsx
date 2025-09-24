// Define the props that this component will receive
interface GraphStatsProps {
  nodeCount: number;
  edgeCount: number;
}

const GraphStats: React.FC<GraphStatsProps> = ({
  nodeCount,
  edgeCount
}) => {
  return (
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
  );
};

export default GraphStats;