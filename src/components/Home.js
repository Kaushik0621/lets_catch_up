// src/components/Home.js
import React from 'react';
import './Home.css';

function Home() {
    return (
        <div className="home">
            <h1>Welcome to My Portfolio</h1>
            <p>I am Kaushik Das, an experienced AI Developer with a strong background in Machine Learning, Deep Learning, and Generative AI. With over four years of industry experience, I specialize in Natural Language Generation, Large Language Models, and advanced ML frameworks.</p>
            
            <section className="summary">
                <h2>About Me</h2>
                <p>I'm passionate about developing AI-driven solutions that streamline processes, increase efficiency, and bring real-world impact. I am skilled in both front-end and back-end technologies, with a focus on scalable and privacy-centric applications.</p>
            </section>

            <section className="highlights">
                <h2>Recent Highlights</h2>
                <ul>
                    <li>Winner at Encode London 2024 for Specialized AIVM Implementation.</li>
                    <li>Finalist at Mistral AI Hack UK London 2024 for a healthcare chatbot solution.</li>
                    <li>Implemented an ATS system leveraging LangChain and LLM for automated candidate screening.</li>
                </ul>
            </section>
        </div>
    );
}

export default Home;
