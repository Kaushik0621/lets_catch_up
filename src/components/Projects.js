import React from 'react';
import './Projects.css';

function Projects() {
    const projectData = [
        {
            title: "AI Chatbot for Medical Needs",
            description: "Utilized Pixtral-12B-2409 model and integrated NHS data for personalized interaction.",
            link: "https://devpost.com/software/pixtralogist"
        },
        // Additional projects can be added here
    ];

    return (
        <div className="projects">
            <h2>Projects</h2>
            <div className="project-grid">
                {projectData.map((project, index) => (
                    <div key={index} className="project-card">
                        <h3>{project.title}</h3>
                        <p>{project.description}</p>
                        <a href={project.link} target="_blank" rel="noopener noreferrer">View Project</a>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Projects;
