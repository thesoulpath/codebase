import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="bg-red-500/10 border-red-500/20 max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center space-x-2">
              <AlertCircle size={20} />
              <span>Something went wrong</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-300 text-sm mb-4">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <Button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}