import React, { Component } from 'react';
import { AlertOctagon, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // In production, log error without leaking sensitive credentials
    console.error("ErrorBoundary caught an unhandled UI error:", error?.message || error);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    });
    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch {}
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { title = "Something went wrong in this section", sectionName } = this.props;

      return (
        <div className="min-h-[220px] w-full bg-slate-900/90 border border-rose-900/50 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl my-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-500 shadow-lg shadow-rose-950">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-1 max-w-md">
            <h2 className="text-base font-extrabold text-white">
              {sectionName ? `${sectionName}: ` : ''}{title}
            </h2>
            <p className="text-xs text-slate-400">
              The application encountered an unexpected display issue. Your saved data and orders remain safe in the database.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry / Reload Section</span>
            </button>

            <a
              href="/"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-2 transition"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Customer Menu</span>
            </a>
          </div>

          {/* Technical Details Toggle */}
          <div className="w-full max-w-lg pt-2">
            <button
              type="button"
              onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
              className="text-[11px] text-slate-500 hover:text-slate-400 flex items-center justify-center gap-1 mx-auto transition"
            >
              <span>{this.state.showDetails ? "Hide technical details" : "Show technical details"}</span>
              {this.state.showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {this.state.showDetails && (
              <div className="mt-2 text-left bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-rose-300/80 overflow-x-auto max-h-40">
                <p className="font-bold text-rose-400">{String(this.state.error?.message || this.state.error)}</p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="mt-1 text-[10px] text-slate-500 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
