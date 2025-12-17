import React, { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null }; // Initial state: no error yet

  static getDerivedStateFromError(error) {
    // Called after an error is caught; updates state to reflect the error
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      // If an error occurred, render the fallback UI
      return (
        <div style={{ padding: '20px', color: '#d32f2f', textAlign: 'center' }}>
          <h2>A apărut o eroare!</h2>
          <p>{this.state.error.message}</p> {/* Displays the error message */}
          <button onClick={() => window.location.reload()}>Reîncarcă pagina</button> {/* Allows user to reload */}
        </div>
      );
    }
    return this.props.children; // If no error, render the child components
  }
}

export default ErrorBoundary;