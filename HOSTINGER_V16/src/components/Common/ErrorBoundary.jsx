/**
 * Global Error Boundary for React
 * Catches all unhandled errors and shows friendly message
 */
import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console (in production, send to error tracking service)
        console.error('Error caught by boundary:', error, errorInfo);

        this.setState({
            error,
            errorInfo
        });

        // In production, send to error tracking service
        if (import.meta.env.MODE === 'production') {
            // Example: Sentry.captureException(error);
        }
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={styles.container}>
                    <div style={styles.content}>
                        <div style={styles.icon}>⚠️</div>
                        <h1 style={styles.title}>Something went wrong</h1>
                        <p style={styles.message}>
                            We're sorry for the inconvenience. Please try again.
                        </p>
                        <div style={styles.buttons}>
                            <button onClick={this.handleReload} style={styles.primaryBtn}>
                                Try Again
                            </button>
                            <button onClick={this.handleGoHome} style={styles.secondaryBtn}>
                                Go to Homepage
                            </button>
                        </div>
                        {import.meta.env.MODE === 'development' && this.state.error && (
                            <details style={styles.details}>
                                <summary style={styles.summary}>Error Details (Dev Only)</summary>
                                <pre style={styles.errorText}>
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
    },
    content: {
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '500px',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    },
    icon: {
        fontSize: '80px',
        marginBottom: '20px'
    },
    title: {
        fontSize: '28px',
        color: '#333',
        marginBottom: '15px',
        fontWeight: '600'
    },
    message: {
        fontSize: '16px',
        color: '#666',
        lineHeight: '1.6',
        marginBottom: '30px'
    },
    buttons: {
        display: 'flex',
        gap: '15px',
        justifyContent: 'center',
        flexWrap: 'wrap'
    },
    primaryBtn: {
        background: '#667eea',
        color: 'white',
        border: 'none',
        padding: '15px 30px',
        borderRadius: '10px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
    },
    secondaryBtn: {
        background: '#f0f0f0',
        color: '#333',
        border: 'none',
        padding: '15px 30px',
        borderRadius: '10px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
    },
    details: {
        marginTop: '30px',
        textAlign: 'left',
        background: '#f5f5f5',
        padding: '15px',
        borderRadius: '8px'
    },
    summary: {
        cursor: 'pointer',
        fontWeight: '600',
        marginBottom: '10px'
    },
    errorText: {
        fontSize: '12px',
        color: '#c62828',
        overflow: 'auto',
        maxHeight: '200px'
    }
};

export default ErrorBoundary;
