// src/components/AppContent.js
import React from 'react';
import './AppContent.css';

// Import images from the assets folder
import profileImage from '../assets/profile.jpg';
import educationImage from '../assets/image.jpg'; 
import hackathonImage from '../assets/image.jpg'; 
// Import Font Awesome icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons';
import { faLinkedin, faGithub, faDev, faTwitter } from '@fortawesome/free-brands-svg-icons';


function AppContent() {
    return (
        <div className="content">
             <header className="content-header fixed-header">
                
                <div className="contact-info">
                    <p><a href="mailto:Kaushikdas.career@gmail.com"> 
                        <FontAwesomeIcon icon={faEnvelope} /> &nbsp; 
                        Kaushikdas.career@gmail.com</a>
                    </p>
                    <p>
                        <FontAwesomeIcon icon={faPhone} /> &nbsp;  +44 07388449042
                    </p>
                    <a href="https://www.linkedin.com/in/kaushikdas-connections" target="_blank" rel="noopener noreferrer">
                        <FontAwesomeIcon icon={faLinkedin} /> &nbsp; LinkedIn
                    </a>|
                    <a href="https://github.com/Kaushik0621" target="_blank" rel="noopener noreferrer">
                        <FontAwesomeIcon icon={faGithub} /> &nbsp; GitHub
                    </a> |
                    <a href="https://devpost.com/kaushik0621" target="_blank" rel="noopener noreferrer">
                        <FontAwesomeIcon icon={faDev} /> &nbsp;  Devpost
                    </a> |
                    <a href="https://x.com/Kaushik_AI_X" target="_blank" rel="noopener noreferrer">
                        <FontAwesomeIcon icon={faTwitter} /> &nbsp; Twitter
                    </a>
                </div>
            </header>
            <section id="about">
                <h2>About Me</h2>
                <p>Experienced AI Developer with over 4 years of work experience, holding a postgraduate degree in Artificial Intelligence. Specialized in Machine Learning, Deep Learning, Generative AI, and Natural Language Generation. Proficient in developing and deploying Object Detection Models.</p>
            </section>

            <section id="experience">
                <h2>Work Experience</h2>
                <div className="job">
                    <h3>Machine Learning Engineer | Freelance | July 2024 – Present</h3>
                    <ul>
                        <li>Increased efficiency by 30% in cost quotation processes by implementing object detection and automated information extraction
                        from project documentation, utilizing LLM and RAG pipelines to streamline data retrieval and reduce manual effort.</li>
                        <li>Achieved a 40% reduction in documentation turnaround time by streamlining processes.</li>
                    </ul>
                </div>
                <div className="job">
                    <h3>Software Engineer | Kairos Consulting | July 2019 – December 2022</h3>
                    <ul>
                        <li>Developed real-time image processing solutions, improved anomaly detection accuracy by 15% using CNNs.</li>
                        <li>Contributed to an R&D project for a healthcare client focused on real-time image processing. Utilizing OpenCV and Scikit-Image
                        for Noise reduction, contrast enhancement, and feature extraction.</li>
                        <li>Built an end-to-end web app for an e-commerce client, increasing sales by 23% with predictive analytics.</li>
                        <li>Deployed applications with Docker and AWS, integrated CI/CD pipelines for continuous delivery.</li>
                    </ul>
                </div>
            </section>

            <section id="education">
                <h2>Education</h2>
                <div className="education-entry">
                    <h3>Master of Science in Artificial Intelligence | University of Aberdeen, UK | 2023 - 2024</h3>
                    <p>Focused on generative AI, machine learning, and deep learning. Developed models like Random Forest, LSTM, GANs, and Transformer networks.</p>
                    <img src={educationImage} alt="Education" className="section-image" />
                </div>
                <div className="education-entry">
                    <h3>Bachelor of Technology in Electronics and Communications | IEM, Kolkata, India | 2015 - 2019</h3>
                </div>
            </section>

            <section id="hackathons">
                <h2>Hackathons</h2>
                <div className="hackathon-entry">
                    <h3>Mistral AI Hack UK London 2024 (Devpost)</h3>
                    <p>Finalist with a web service using Pixtral-12B-2409 model for daily medical needs. Fine-tuned with NHS data.</p>
                    <img src={hackathonImage} alt="Hackathon" className="section-image" />
                </div>
                <div className="hackathon-entry">
                    <h3>Encode London 2024 – Quant Track (RNDM)</h3>
                    <p>Winner with a trading strategy combining technical indicators, sentiment analysis, and cryptocurrency insights.</p>
                </div>
                {/* Add more hackathons as needed */}
            </section>

            <section id="certifications">
                <h2>Certifications</h2>
                <ul>
                    <li>AWS Certified Cloud Practitioner</li>
                    <li>Google Agile Project Management Certification</li>
                    <li>Software Engineer (HackerRank)</li>
                    <li>IBM Machine Learning with Python</li>
                </ul>
            </section>

            <section id="projects">
                <h2>Projects</h2>
                <div className="project">
                    <h3>Computer Vision Based Automated Taxi Stand (GitHub)</h3>
                    <p>Developed a system using YOLO to detect queue density and redirect cab traffic to high-demand areas.</p>
                </div>
                <div className="project">
                    <h3>LLM and LangChain Based ATS System (GitHub)</h3>
                    <p>Created an ATS system using LangChain and LLMs to screen candidates based on experience and education relevance.</p>
                </div>
            </section>

            <section id="skills">
                <h2>Skills</h2>
                <p><strong>Programming and Web Development:</strong> Python, Java, C, HTML, CSS, JavaScript, Django, React</p>
                <p><strong>Machine Learning & Data Science:</strong> TensorFlow, PyTorch, Scikit-learn, Keras, Generative AI, NLG, LLMs</p>
                <p><strong>Frameworks & Tools:</strong> React, Fast API, Flask, Gradio Framework</p>
                <p><strong>Database & Cloud Computing:</strong> MySQL, MongoDB, Docker, AWS</p>
            </section>
        </div>
    );
}

export default AppContent;
