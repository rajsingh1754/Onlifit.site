import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", height: "100vh", background: "#f8fafc",
          fontFamily: "'Inter', system-ui, sans-serif", padding: 24, textAlign: "center"
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: "#0f172a", fontSize: 22, marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24, maxWidth: 400 }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              background: "#6c47ff", color: "#fff", border: "none", borderRadius: 8,
              padding: "10px 28px", fontSize: 15, cursor: "pointer", fontWeight: 600
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
