const LoadingState = () => {
  return (
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading dependency graph...</div>
            <div className="loading-subtext">Analyzing project structure</div>
          </div>
        </div>
  )
}

export default LoadingState