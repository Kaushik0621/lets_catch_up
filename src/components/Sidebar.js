// src/components/Sidebar.js
import React from 'react';
import { Link } from 'react-scroll';
import './Sidebar.css';
import profileImage from '../assets/profile.png';

function Sidebar() {
    return (
        <div className="sidebar">
            <div className="profile-container" >
                <img src={profileImage} alt="Kaushik Das" className="profile-image" />
            </div>
            <h2>Kaushik Das</h2>
            <p>AI Developer | Machine Learning Engineer</p>
            <div className="contact-info">
                <p>Email: Kaushikdas.career@gmail.com</p>
                <p>Phone: +44 07388449042</p>
                <a href="https://www.linkedin.com/in/kaushikdas-connections" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                <a href="https://github.com/Kaushik0621" target="_blank" rel="noopener noreferrer">GitHub</a>
                <a href="https://devpost.com/kaushik0621" target="_blank" rel="noopener noreferrer">Devpost</a>
                <a href="https://x.com/Kaushik_AI_X" target="_blank" rel="noopener noreferrer">Twitter</a>
            </div>
            <nav>
                <Link activeClass="active" to="about" spy={true} smooth={true} offset={-70} duration={500}>About Me</Link>
                <Link activeClass="active" to="experience" spy={true} smooth={true} offset={-70} duration={500}>Work Experience</Link>
                <Link activeClass="active" to="education" spy={true} smooth={true} offset={-70} duration={500}>Education</Link>
                <Link activeClass="active" to="hackathons" spy={true} smooth={true} offset={-70} duration={500}>Hackathons</Link>
                <Link activeClass="active" to="certifications" spy={true} smooth={true} offset={-70} duration={500}>Certifications</Link>
                <Link activeClass="active" to="projects" spy={true} smooth={true} offset={-70} duration={500}>Projects</Link>
                <Link activeClass="active" to="skills" spy={true} smooth={true} offset={-70} duration={500}>Skills</Link>
            </nav>
        </div>
    );
}

export default Sidebar;
