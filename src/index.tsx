import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { SupabaseProvider } from './contexts/SupabaseContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { logEnvironmentStatus } from './lib/envValidator';

// 환경변수 검증 실행
logEnvironmentStatus();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <SupabaseProvider>
        <App />
      </SupabaseProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
