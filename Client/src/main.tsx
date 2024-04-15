import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Assuming App.js has been renamed to App.tsx
import './index.css';

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('Failed to find the root element');
}
