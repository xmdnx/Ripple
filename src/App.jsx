import React from 'react';
import { createRoot } from 'react-dom/client';
import Island from './Island';
import './App.css';

if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    console.warn("Caught window error:", event.error || event.message);
    event.preventDefault?.();
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.warn("Caught unhandled promise rejection:", event.reason);
    event.preventDefault?.();
  });
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("Recovered from React error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "8px 12px", background: "rgba(0,0,0,0.8)", borderRadius: 16, color: "#fff", fontSize: 12 }}>
          Ripple recovered from an error.
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  return (
    <ErrorBoundary>
      <Island />
    </ErrorBoundary>
  );
};

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
