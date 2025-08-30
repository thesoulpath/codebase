'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { App } from '@/components/App';

export default function HomePage() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
