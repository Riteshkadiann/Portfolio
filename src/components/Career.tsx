import "./styles/Career.css";

const Career = () => {
  return (
    <div className="career-section section-container">
      <div className="career-container">
        <h2>
          My career <span>&</span>
          <br /> experience
        </h2>
        <div className="career-info">
          <div className="career-timeline">
            <div className="career-dot"></div>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>Software Engineering Technology Student</h4>
                <h5>Centennial College</h5>
              </div>
              <h3>2024 - 2027</h3>
            </div>
            <p>
              Advanced Diploma with CGPA 3.7/4.5. Relevant coursework: Data Structures & Algorithms, Programming, 
              Advanced Database Concepts, Software Systems Design, Unix/Linux, Linear Algebra & Statistics.
            </p>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>AI Developer Intern</h4>
                <h5>DataCove.ai</h5>
              </div>
              <h3>2026</h3>
            </div>
            <p>
              Contributed to the development of 'DefenceNet', an AI-powered cybersecurity application that helps users detect and avoid phishing URLs and other online threats.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Career;
