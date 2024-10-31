import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './components/Home';
import Projects from './components/Projects';
import Experience from './components/Experience';
import Skills from './components/Skills';
import Contact from './components/Contact';
import './App.css';

function App() {
    return (
        <Router>
            <nav>
                <Link to="/">Home</Link> | 
                <Link to="/projects">Projects</Link> | 
                <Link to="/experience">Experience</Link> | 
                <Link to="/skills">Skills</Link> | 
                <Link to="/contact">Contact</Link>
            </nav>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/experience" element={<Experience />} />
                <Route path="/skills" element={<Skills />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="*" element={<Home />} /> {/* Fallback route */}
            </Routes>
        </Router>
    );
}

export default App;
