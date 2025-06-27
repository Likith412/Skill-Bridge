import "./index.css";

const FailureView = () => {
  const handleRetry = () => window.location.reload();

  return (
    <main className="failure-view-page">
      <section className="failure-view-card">
        <div className="failure-view-icon">⚠️</div>
        <h1 className="failure-view-title">Something Went Wrong</h1>
        <p className="failure-view-message">
          We are having some trouble fetching the data. Please try again.
        </p>
        <button className="failure-view-button" onClick={handleRetry}>
          Try Again
        </button>
      </section>
    </main>
  );
};

export default FailureView;
