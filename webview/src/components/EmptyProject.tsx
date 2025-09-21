const EmptyProject = () => {
  return (
    <div className="app-container">
        <div className="empty-state">
          <div className="empty-content">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <h2 className="empty-title">No Dependencies Found</h2>
            <p className="empty-description">
              We couldn't find any dependencies in your project. Make sure your project has some files with imports or dependencies.
            </p>
          </div>
        </div>
      </div>
  )
}

export default EmptyProject