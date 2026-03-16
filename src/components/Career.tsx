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
                <h4>Business Development Executive</h4>
                <h5>DataCove.ai</h5>
              </div>
              <h3>2025</h3>
            </div>
            <p>
              Leading AI solution outreach to Canadian & US legal firms for early-stage adoption.
              Translated complex workflow automation and phishing detection systems into
              business solutions. Collaborated with founders on product-market fit refinement.
            </p>
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
              AWS Certified Solutions Architect – Associate (2026).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Career;
