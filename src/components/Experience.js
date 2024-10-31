import React from 'react';
import './Experience.css';

function Experience() {
    const experiences = [
        {
            title: "Machine Learning Engineer",
            company: "Freelance",
            date: "July 2024 – Present",
            description: "Improved cost quotation efficiency by 30% with LLM-based automation."
        },
        // Additional experiences can be added here
    ];

    return (
        <div className="experience">
            <h2>Experience</h2>
            {experiences.map((exp, index) => (
                <div key={index} className="experience-card">
                    <h3>{exp.title} - {exp.company}</h3>
                    <span>{exp.date}</span>
                    <p>{exp.description}</p>
                </div>
            ))}
        </div>
    );
}

export default Experience;
