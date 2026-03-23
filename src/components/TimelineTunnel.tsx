import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Text, Float, Image } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./styles/TimelineTunnel.css";

gsap.registerPlugin(ScrollTrigger);

export interface TimelineEvent {
  id: string;
  year: number;
  month: number;
  title: string;
  company: string;
  type: "work" | "education" | "project" | "milestone";
  description: string;
  technologies: string[];
  highlights: string[];
  image: string;
}

interface TimelineData {
  timeline: TimelineEvent[];
}

interface TunnelNodeProps {
  event: TimelineEvent;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  isActive: boolean;
  onClick: (event: TimelineEvent) => void;
  index: number;
}

function TunnelNode({ event, position, rotation, isActive, onClick, index }: TunnelNodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const cardRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const typeColors: Record<string, string> = {
    work: "#4CAF50",
    education: "#2196F3",
    project: "#FF9800",
    milestone: "#9C27B0",
  };

  const color = typeColors[event.type] || "#ffffff";

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + index) * 0.05;
    }
    if (cardRef.current) {
      const targetScale = isActive ? 1.2 : hovered ? 1.1 : 1;
      cardRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <Float speed={1} rotationIntensity={0.1} floatIntensity={0.3}>
        <mesh
          ref={cardRef}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onClick={() => onClick(event)}
        >
          <planeGeometry args={[3, 2]} />
          <meshStandardMaterial
            color={isActive ? color : "#1a1a2e"}
            emissive={color}
            emissiveIntensity={isActive ? 0.5 : hovered ? 0.3 : 0.1}
            metalness={0.5}
            roughness={0.3}
            transparent
            opacity={0.9}
          />
        </mesh>

        <Text
          position={[0, 0.6, 0.1]}
          fontSize={0.2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          maxWidth={2.5}
        >
          {event.title}
        </Text>

        <Text
          position={[0, 0.3, 0.1]}
          fontSize={0.12}
          color="rgba(255,255,255,0.7)"
          anchorX="center"
          anchorY="middle"
          maxWidth={2.5}
        >
          {event.company}
        </Text>

        <Text
          position={[0, -0.7, 0.1]}
          fontSize={0.15}
          color={color}
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {event.year}
        </Text>

        {isActive && (
          <mesh position={[0, 0, -0.1]}>
            <planeGeometry args={[3.2, 2.2]} />
            <meshBasicMaterial color={color} transparent opacity={0.2} />
          </mesh>
        )}
      </Float>
    </group>
  );
}

interface ParticleFlowProps {
  startZ: number;
  endZ: number;
  count: number;
}

function ParticleFlow({ startZ, endZ, count }: ParticleFlowProps) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 * 3;
      const z = startZ + (i / count) * (endZ - startZ);
      const radius = 4 + Math.sin(angle * 2) * 0.5;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, z));
    }
    return pts;
  }, [startZ, endZ, count]);

  const lineRef = useRef<THREE.Line>(null);

  useFrame((state) => {
    if (lineRef.current) {
      lineRef.current.rotation.z = state.clock.elapsedTime * 0.1;
    }
  });

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return (
    <line ref={lineRef} geometry={geometry}>
      <lineBasicMaterial color="#61DAFB" transparent opacity={0.3} />
    </line>
  );
}

interface YearMarkerProps {
  year: number;
  position: THREE.Vector3;
}

function YearMarker({ year, position }: YearMarkerProps) {
  return (
    <group position={position}>
      <Text
        position={[0, 0, 0]}
        fontSize={0.5}
        color="rgba(255,255,255,0.3)"
        anchorX="center"
        anchorY="middle"
      >
        {year}
      </Text>
    </group>
  );
}

interface TunnelProps {
  events: TimelineEvent[];
  onNodeClick: (event: TimelineEvent) => void;
  activeIndex: number;
  scrollProgress: number;
}

function Tunnel({ events, onNodeClick, activeIndex, scrollProgress }: TunnelProps) {
  const tunnelRadius = 5;
  const tunnelLength = events.length * 8;

  const nodePositions = useMemo(() => {
    return events.map((event, index) => {
      const angle = (index / events.length) * Math.PI * 2;
      const z = -index * 8;
      return {
        position: new THREE.Vector3(
          Math.cos(angle) * tunnelRadius * 0.7,
          Math.sin(angle) * tunnelRadius * 0.7,
          z
        ),
        rotation: new THREE.Euler(0, -angle + Math.PI / 2, 0),
      };
    });
  }, [events, tunnelRadius]);

  const yearMarkers = useMemo(() => {
    const years = [...new Set(events.map((e) => e.year))].sort((a, b) => b - a);
    return years.map((year) => {
      const firstIndex = events.findIndex((e) => e.year === year);
      const z = -firstIndex * 8;
      return { year, position: new THREE.Vector3(0, 0, z) };
    });
  }, [events]);

  return (
    <group>
      <mesh position={[0, 0, -tunnelLength / 2]}>
        <cylinderGeometry args={[tunnelRadius, tunnelRadius, tunnelLength, 32, 1, true]} />
        <meshBasicMaterial color="#0a0a1a" side={THREE.BackSide} transparent opacity={0.8} />
      </mesh>

      <mesh position={[0, 0, -tunnelLength / 2]}>
        <cylinderGeometry args={[tunnelRadius + 0.1, tunnelRadius + 0.1, tunnelLength, 32, 1, true]} />
        <meshBasicMaterial color="#1a1a2e" side={THREE.BackSide} wireframe />
      </mesh>

      {events.map((event, index) => (
        <TunnelNode
          key={event.id}
          event={event}
          position={nodePositions[index].position}
          rotation={nodePositions[index].rotation}
          isActive={activeIndex === index}
          onClick={onNodeClick}
          index={index}
        />
      ))}

      {yearMarkers.map((marker) => (
        <YearMarker key={marker.year} year={marker.year} position={marker.position} />
      ))}

      <ParticleFlow startZ={0} endZ={-tunnelLength} count={100} />

      <Stars radius={20} depth={tunnelLength} count={2000} factor={2} saturation={0} fade speed={0.5} />

      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 5]} intensity={1} color="#61DAFB" />
      <pointLight position={[0, 0, -tunnelLength / 2]} intensity={0.5} color="#EE4C2C" />
    </group>
  );
}

interface CameraControllerProps {
  scrollProgress: number;
  tunnelLength: number;
}

function CameraController({ scrollProgress, tunnelLength }: CameraControllerProps) {
  const { camera, gl } = useThree();
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    gl.domElement.addEventListener("mousemove", handleMouseMove);
    return () => gl.domElement.removeEventListener("mousemove", handleMouseMove);
  }, [gl]);

  useFrame(() => {
    const targetZ = -scrollProgress * tunnelLength;
    const parallaxX = mouseRef.current.x * 0.5;
    const parallaxY = mouseRef.current.y * 0.3;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, parallaxX, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, parallaxY, 0.05);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ + 5, 0.1);
  });

  return null;
}

interface ModalProps {
  event: TimelineEvent | null;
  onClose: () => void;
}

function Modal({ event, onClose }: ModalProps) {
  if (!event) return null;

  const typeLabels: Record<string, string> = {
    work: "Work Experience",
    education: "Education",
    project: "Project",
    milestone: "Milestone",
  };

  const typeColors: Record<string, string> = {
    work: "#4CAF50",
    education: "#2196F3",
    project: "#FF9800",
    milestone: "#9C27B0",
  };

  return (
    <div className="timeline-modal-overlay" onClick={onClose}>
      <div className="timeline-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        <div className="modal-header">
          <span
            className="modal-type-badge"
            style={{ backgroundColor: typeColors[event.type] }}
          >
            {typeLabels[event.type]}
          </span>
          <h2 className="modal-title">{event.title}</h2>
          <p className="modal-company">{event.company}</p>
          <p className="modal-date">
            {event.month}/{event.year}
          </p>
        </div>

        <div className="modal-image">
          <img src={event.image} alt={event.title} />
        </div>

        <p className="modal-description">{event.description}</p>

        <div className="modal-section">
          <h4>Technologies</h4>
          <div className="modal-tags">
            {event.technologies.map((tech) => (
              <span key={tech} className="modal-tag">
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="modal-section">
          <h4>Highlights</h4>
          <ul className="modal-highlights">
            {event.highlights.map((highlight, i) => (
              <li key={i}>{highlight}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

interface MobileTimelineProps {
  events: TimelineEvent[];
  onNodeClick: (event: TimelineEvent) => void;
}

function MobileTimeline({ events, onNodeClick }: MobileTimelineProps) {
  const typeColors: Record<string, string> = {
    work: "#4CAF50",
    education: "#2196F3",
    project: "#FF9800",
    milestone: "#9C27B0",
  };

  return (
    <div className="mobile-timeline">
      {events.map((event, index) => (
        <div
          key={event.id}
          className="mobile-timeline-item"
          onClick={() => onNodeClick(event)}
        >
          <div className="mobile-timeline-line">
            <div
              className="mobile-timeline-dot"
              style={{ backgroundColor: typeColors[event.type] }}
            />
            {index < events.length - 1 && <div className="mobile-timeline-connector" />}
          </div>

          <div className="mobile-timeline-content">
            <div className="mobile-timeline-year">{event.year}</div>
            <h3 className="mobile-timeline-title">{event.title}</h3>
            <p className="mobile-timeline-company">{event.company}</p>
            <p className="mobile-timeline-description">{event.description}</p>
            <div className="mobile-timeline-tags">
              {event.technologies.slice(0, 3).map((tech) => (
                <span key={tech} className="mobile-timeline-tag">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const TimelineTunnel = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [webglAvailable, setWebglAvailable] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const tunnelLength = events.length * 8;

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("webgl2");
    if (!gl) {
      setWebglAvailable(false);
    }
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetch("/data/timeline.json")
      .then((res) => res.json())
      .then((data: TimelineData) => {
        setEvents(data.timeline);
      })
      .catch((err) => console.error("Failed to load timeline:", err));
  }, []);

  useEffect(() => {
    if (isMobile || !scrollContainerRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: scrollContainerRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        onUpdate: (self) => {
          setScrollProgress(self.progress);
          const newIndex = Math.floor(self.progress * events.length);
          setActiveIndex(Math.min(newIndex, events.length - 1));
        },
      });
    }, scrollContainerRef);

    return () => ctx.revert();
  }, [events.length, isMobile]);

  const handleNodeClick = useCallback((event: TimelineEvent) => {
    setSelectedEvent(event);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  if (isMobile) {
    return (
      <div className="timeline-tunnel-section">
        <div className="timeline-header">
          <h2>
            Career <span>Journey</span>
          </h2>
          <p>A timeline of my professional growth and achievements</p>
        </div>
        <div className="mobile-timeline-wrapper">
          <MobileTimeline events={events} onNodeClick={handleNodeClick} />
        </div>
        <Modal event={selectedEvent} onClose={handleCloseModal} />
      </div>
    );
  }

  return (
    <div className="timeline-tunnel-section" ref={scrollContainerRef}>
      <div className="timeline-header">
        <h2>
          Career <span>Journey</span>
        </h2>
        <p>Scroll through time to explore my professional journey</p>
      </div>

      <div className="timeline-scroll-spacer" style={{ height: `${events.length * 80}vh` }}>
        <div className="timeline-canvas-container" ref={containerRef}>
          {webglAvailable ? (
            <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
              <Tunnel
                events={events}
                onNodeClick={handleNodeClick}
                activeIndex={activeIndex}
                scrollProgress={scrollProgress}
              />
              <CameraController scrollProgress={scrollProgress} tunnelLength={tunnelLength} />
            </Canvas>
          ) : (
            <div className="webgl-fallback">
              <p>WebGL is not available. Please enable hardware acceleration.</p>
            </div>
          )}
        </div>

        <div className="timeline-progress-indicator">
          <div
            className="timeline-progress-bar"
            style={{ height: `${scrollProgress * 100}%` }}
          />
        </div>

        <div className="timeline-nav">
          {events.map((event, index) => (
            <button
              key={event.id}
              className={`timeline-nav-item ${activeIndex === index ? "active" : ""}`}
              onClick={() => {
                const targetProgress = index / events.length;
                window.scrollTo({
                  top: targetProgress * document.body.scrollHeight,
                  behavior: "smooth",
                });
              }}
            >
              <span className="nav-year">{event.year}</span>
              <span className="nav-title">{event.title}</span>
            </button>
          ))}
        </div>
      </div>

      <Modal event={selectedEvent} onClose={handleCloseModal} />
    </div>
  );
};

export default TimelineTunnel;
