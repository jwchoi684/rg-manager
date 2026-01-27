import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TutorialProvider } from './context/TutorialContext';
import App from './App';
import './styles/App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TutorialProvider>
          <App />
        </TutorialProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
