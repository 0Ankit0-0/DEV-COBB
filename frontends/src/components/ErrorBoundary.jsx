import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Component Error:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      // You can customize the fallback UI here
      return (
        <div className="error-boundary">
          <h3>Something went wrong with this component.</h3>
          {this.props.fallback ? (
            this.props.fallback
          ) : (
            <div className="error-details">
              <p>{this.state.error && this.state.error.toString()}</p>
              <button
                className="btn btn-primary"
                onClick={() => this.setState({ hasError: false })}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
