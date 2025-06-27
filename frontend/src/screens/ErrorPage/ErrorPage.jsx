// src/components/ErrorPage.jsx

import React from "react";
import "./ErrorPage.css";

const ErrorPage = () => {
  const handleRetry = () => window.location.reload();

  return (
    <main className="error-page">
      <section className="error-card">
        <div className="error-icon">⚠️</div>
        <h1 className="error-title">Something Went Wrong</h1>
        <p className="error-message">
          We are having some trouble fetching the data. Please try again.
        </p>
        <button className="error-button" onClick={handleRetry}>
          Try Again
        </button>
      </section>
    </main>
  );
};

export default ErrorPage;
