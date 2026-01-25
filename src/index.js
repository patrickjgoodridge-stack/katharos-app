import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './AppEnhanced';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from './AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <Analytics />
    </AuthProvider>
  </React.StrictMode>
);
