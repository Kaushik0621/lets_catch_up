// src/components/Sidebar.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';
import profileImage from '../assets/profile.jpg';

function Sidebar() {
    return (
        <div className="sidebar">
            <img src={profileImage} alt="Profile" className="profile-image" />
            <h2>Kaushik Das</h2>
            <p>AI Developer | Machine Learning Engineer</p>
            <div className="contact-info">
                <p>Email: Kaushikdas.career@gmail.com</p>
                <p>Phone: +44 07388449042</p>
                <a href="https://www.linkedin.com/in/kaushikdas-connections" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                <a href="https://github.com/Kaushik0621" target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
            <nav>
                <Link to="/">Home</Link>
                <Link to="/projects">Projects</Link>
                <Link to="/experience">Experience</Link>
                <Link to="/skills">Skills</Link>
                <Link to="/contact">Contact</Link>
            </nav>
        </div>
    );
}

export default Sidebar;
