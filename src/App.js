// src/App.js
import React from 'react';
import Sidebar from './components/Sidebar';
import AppContent from './components/AppContent';
import './App.css';

function App() {
    return (
        <div className="app">
            <Sidebar />
            <AppContent />
        </div>
    );
}

export default App;
