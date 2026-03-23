import { lazy, PropsWithChildren, Suspense, useEffect, useState } from "react";
import About from "./About";
import Career from "./Career";
import Contact from "./Contact";
import Cursor from "./Cursor";
import Landing from "./Landing";
import Navbar from "./Navbar";
import SocialIcons from "./SocialIcons";
import WhatIDo from "./WhatIDo";
import Work from "./Work";
import setSplitText from "./utils/splitText";
import "./styles/SkillGalaxySection.css";

const TechStack = lazy(() => import("./TechStack"));
const SkillGalaxy = lazy(() => import("./SkillGalaxy/index.tsx"));
const TimelineTunnel = lazy(() => import("./TimelineTunnel/index.tsx"));

const MainContainer = ({ children }: PropsWithChildren) => {
  const [isDesktopView, setIsDesktopView] = useState<boolean>(
    window.innerWidth > 1024
  );

  useEffect(() => {
    const resizeHandler = () => {
      setSplitText();
      setIsDesktopView(window.innerWidth > 1024);
    };
    resizeHandler();
    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, [isDesktopView]);

  return (
    <div className="container-main">
      <Cursor />
      <Navbar />
      <SocialIcons />
      {isDesktopView && children}
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <div className="container-main">
            <Landing>{!isDesktopView && children}</Landing>
            <About />
            <WhatIDo />
            <Career />
            {/* 3D时间轴隧道组件 */}
            <section id="timeline-tunnel" className="timeline-tunnel-section">
              <div className="section-header">
                <h2>Journey Through Time</h2>
                <p>Scroll to explore my career timeline</p>
              </div>
              <Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Loading Timeline...</div>}>
                <TimelineTunnel />
              </Suspense>
            </section>
            <Work />
            {/* 3D技能星系组件 */}
            <section id="skill-galaxy" className="skill-galaxy-section">
              <div className="section-header">
                <h2>Skill Galaxy</h2>
                <p>Explore my technical skills in 3D space</p>
              </div>
              <Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Loading Galaxy...</div>}>
                <SkillGalaxy />
              </Suspense>
            </section>
            {isDesktopView && (
              <Suspense fallback={<div>Loading....</div>}>
                <TechStack />
              </Suspense>
            )}
            <Contact />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainContainer;
