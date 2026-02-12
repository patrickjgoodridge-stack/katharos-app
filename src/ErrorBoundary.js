import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          color: '#d4d4d4',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>
          <div style={{ textAlign: 'center', maxWidth: 480, padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>Something went wrong</div>
            <p style={{ fontSize: 15, color: '#a1a1a1', lineHeight: 1.6, marginBottom: 24 }}>
              An unexpected error occurred. Your data has been saved automatically.
            </p>
            <pre style={{
              background: '#1a1a1a',
              border: '1px solid #2d2d2d',
              borderRadius: 8,
              padding: 16,
              fontSize: 12,
              color: '#ef4444',
              textAlign: 'left',
              overflow: 'auto',
              maxHeight: 120,
              marginBottom: 24,
            }}>
              {this.state.error?.message || 'Unknown error'}
            </pre>
            <button
              onClick={this.handleReset}
              style={{
                background: '#ffffff',
                color: '#0a0a0a',
                border: 'none',
                borderRadius: 8,
                padding: '12px 32px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
