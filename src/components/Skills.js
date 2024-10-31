// src/components/Skills.js
import React from 'react';
import './Skills.css';

function Skills() {
    const skills = [
        "Python",
        "JavaScript",
        "Machine Learning",
        "Deep Learning",
        "React",
        "Django",
        "TensorFlow",
        "PyTorch",
        "AWS",
        "Docker",
        "HTML",
        "CSS",
        "Java",
        "C++"
    ];

    return (
        <div className="skills">
            <h2>Skills</h2>
            <div className="skills-list">
                {skills.map((skill, index) => (
                    <div key={index} className="skill-item">
                        {skill}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Skills;
