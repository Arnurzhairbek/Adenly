import React from 'react';
import Card from './ui/Card';
import Button from './ui/Button';

class ErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary қатені ұстады:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={() => {
            this.setState({ hasError: false, error: null, errorInfo: null });
          }}
        />
      );
    }

    return this.props.children;
  }
}

function ErrorFallback({ error, errorInfo, onReset }) {
  const handleGoHome = () => {
    window.location.href = '/home';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <div className="text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Бірдеңе дұрыс болмады
          </h1>
          <p className="text-white/70 mb-6">
            Күтпеген қате орын алды. Алаңдамаңыз, біз бұл жөнінде жұмыс істеп жатырмыз!
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div className="text-left bg-slate-800 rounded-lg p-4 mb-6 overflow-auto max-h-64">
              <details className="text-white/80">
                <summary className="cursor-pointer text-red-400 font-semibold mb-2">
                  Қате мәліметтері (тек дамыту режимінде)
                </summary>
                <pre className="text-xs text-red-300 mt-2 whitespace-pre-wrap">
                  {error && error.toString()}
                  {errorInfo && errorInfo.componentStack}
                </pre>
              </details>
            </div>
          )}

          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              onClick={onReset}
              variant="primary"
            >
              Қайталау
            </Button>
            <Button
              onClick={handleGoHome}
              variant="secondary"
            >
              Басты бетке оралу
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Обертка для использования как функциональный компонент
export default function ErrorBoundary({ children }) {
  return <ErrorBoundaryClass>{children}</ErrorBoundaryClass>;
}

