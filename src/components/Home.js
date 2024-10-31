import React from 'react';
import './Home.css';

function Home() {
    return (
        <div className="home">
            <h1>Kaushik Das</h1>
            <p>AI Developer | Machine Learning Engineer</p>
            <p>Experienced AI Developer specializing in Generative AI, NLP, and Object Detection. Skilled in LLMs, RAG Pipelines, and Deep Learning.</p>
            <button onClick={() => window.location.href = "/contact"}>Contact Me</button>
        </div>
    );
}

export default Home;
