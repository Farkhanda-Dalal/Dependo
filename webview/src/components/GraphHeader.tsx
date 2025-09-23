// Define the props interface for type safety
interface GraphHeaderProps {
  handleSearch: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const GraphHeader: React.FC<GraphHeaderProps> = ({ handleSearch }) => {
  return (
    <div className="graph-header">
      <h1 className="graph-title">Dependency Graph</h1>
      <p className="graph-subtitle">
        Visual representation of your project's dependencies
      </p>
      <input
        type="text"
        placeholder="Search by file name..."
        onKeyDown={handleSearch}
        className="search-input"
      />
    </div>
  );
};

export default GraphHeader;
