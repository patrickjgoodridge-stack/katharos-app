import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './AppEnhanced';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from './AuthContext';
import posthog from 'posthog-js';

if (process.env.REACT_APP_POSTHOG_KEY) {
  posthog.init(process.env.REACT_APP_POSTHOG_KEY, {
    api_host: process.env.REACT_APP_POSTHOG_HOST || 'https://us.i.posthog.com',
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <Analytics />
    </AuthProvider>
  </React.StrictMode>
);
