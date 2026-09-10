import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import Portal from './Portal';

function Root() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === '/login' || path === '/dashboard' || path === '/admin') {
    return <Portal admin={path === '/admin'} />;
  }
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><Root /></React.StrictMode>,
);
