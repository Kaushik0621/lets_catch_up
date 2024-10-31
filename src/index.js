// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import './App.css'; // Import global styles
import App from './App';
import reportWebVitals from './reportWebVitals';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// Optional: Measure performance of your app
reportWebVitals(console.log);
