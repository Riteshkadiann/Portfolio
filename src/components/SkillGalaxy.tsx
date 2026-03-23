import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import "./styles/SkillGalaxy.css";

export interface Skill {
  id: string;
  name: string;
  proficiency: number;
  category: string;
  relatedSkills: string[];
  description: string;
  color: string;
}

interface SkillsData {
  skills: Skill[];
  categories: Record<string, { name: string; color: string }>;
}

interface SkillPlanetProps {
  skill: Skill;
  position: THREE.Vector3;
  isHovered: boolean;
  isSelected: boolean;
  onHover: (id: string | null) => void;
  onClick: (skill: Skill) => void;
  animationProgress: number;
}

function SkillPlanet({
  skill,
  position,
  isHovered,
  isSelected,
  onHover,
  onClick,
  animationProgress,
}: SkillPlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hoverScale, setHoverScale] = useState(1);

  const baseSize = 0.3 + (skill.proficiency / 100) * 0.5;
  const emissiveIntensity = 0.3 + (skill.proficiency / 100) * 0.7;

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(skill.color),
      emissive: new THREE.Color(skill.color),
      emissiveIntensity: emissiveIntensity,
      metalness: 0.3,
      roughness: 0.4,
    });
  }, [skill.color, emissiveIntensity]);

  useFrame((state) => {
    if (meshRef.current && glowRef.current) {
      const targetScale = isHovered ? 1.5 : isSelected ? 1.3 : 1;
      setHoverScale((prev) => THREE.MathUtils.lerp(prev, targetScale, 0.1));

      const animatedPosition = new THREE.Vector3(
        position.x * animationProgress,
        position.y * animationProgress,
        position.z * animationProgress
      );

      meshRef.current.position.copy(animatedPosition);
      glowRef.current.position.copy(animatedPosition);

      meshRef.current.scale.setScalar(baseSize * hoverScale);
      glowRef.current.scale.setScalar(baseSize * hoverScale * 1.5);

      meshRef.current.rotation.y += 0.005;
      glowRef.current.rotation.y -= 0.003;

      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1;
      glowRef.current.scale.setScalar(baseSize * hoverScale * 1.5 * pulse);
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        onPointerEnter={() => onHover(skill.id)}
        onPointerLeave={() => onHover(null)}
        onClick={() => onClick(skill)}
        material={material}
      >
        <sphereGeometry args={[1, 32, 32]} />
      </mesh>
      <mesh ref={glowRef} transparent opacity={0.3}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={skill.color}
          transparent
          opacity={0.2}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

interface SkillConnectionProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
  animationProgress: number;
}

function SkillConnection({ start, end, color, animationProgress }: SkillConnectionProps) {
  const lineRef = useRef<THREE.Line>(null);

  const geometry = useMemo(() => {
    const points = [start, end];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [start, end]);

  useFrame(() => {
    if (lineRef.current) {
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      material.opacity = 0.3 * animationProgress;
    }
  });

  return (
    <line ref={lineRef} geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.3} linewidth={1} />
    </line>
  );
}

interface TooltipProps {
  skill: Skill | null;
  position: { x: number; y: number };
}

function Tooltip({ skill, position }: TooltipProps) {
  if (!skill) return null;

  return (
    <div
      className="skill-tooltip"
      style={{
        left: position.x + 15,
        top: position.y + 15,
      }}
    >
      <div className="tooltip-header">
        <span className="tooltip-name">{skill.name}</span>
        <span className="tooltip-proficiency">{skill.proficiency}%</span>
      </div>
      <div className="tooltip-bar">
        <div
          className="tooltip-bar-fill"
          style={{ width: `${skill.proficiency}%`, backgroundColor: skill.color }}
        />
      </div>
      <div className="tooltip-category">{skill.category}</div>
    </div>
  );
}

interface DetailPanelProps {
  skill: Skill | null;
  onClose: () => void;
}

function DetailPanel({ skill, onClose }: DetailPanelProps) {
  if (!skill) return null;

  return (
    <div className="skill-detail-panel-overlay" onClick={onClose}>
      <div className="skill-detail-panel" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
        <div className="detail-header">
          <div
            className="detail-color-indicator"
            style={{ backgroundColor: skill.color }}
          />
          <h3 className="detail-name">{skill.name}</h3>
        </div>
        <div className="detail-proficiency">
          <span>Proficiency</span>
          <div className="detail-bar">
            <div
              className="detail-bar-fill"
              style={{ width: `${skill.proficiency}%`, backgroundColor: skill.color }}
            />
          </div>
          <span className="detail-percentage">{skill.proficiency}%</span>
        </div>
        <div className="detail-category">
          <span className="detail-label">Category:</span>
          <span className="detail-value">{skill.category}</span>
        </div>
        <p className="detail-description">{skill.description}</p>
        <div className="detail-related">
          <span className="detail-label">Related Skills:</span>
          <div className="related-skills-list">
            {skill.relatedSkills.map((related) => (
              <span key={related} className="related-skill-tag">
                {related}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CameraControllerProps {
  targetPosition: THREE.Vector3 | null;
  onAnimationComplete: () => void;
}

function CameraController({ targetPosition, onAnimationComplete }: CameraControllerProps) {
  const { camera } = useThree();

  useEffect(() => {
    if (targetPosition) {
      const cameraTarget = new THREE.Vector3(
        targetPosition.x + 3,
        targetPosition.y + 1,
        targetPosition.z + 5
      );

      gsap.to(camera.position, {
        x: cameraTarget.x,
        y: cameraTarget.y,
        z: cameraTarget.z,
        duration: 1.5,
        ease: "power2.inOut",
        onComplete: onAnimationComplete,
      });
    }
  }, [targetPosition, camera, onAnimationComplete]);

  return null;
}

interface GalaxySceneProps {
  skills: Skill[];
  onSkillClick: (skill: Skill) => void;
  onSkillHover: (id: string | null) => void;
  hoveredSkill: string | null;
  selectedSkill: Skill | null;
}

function GalaxyScene({
  skills,
  onSkillClick,
  onSkillHover,
  hoveredSkill,
  selectedSkill,
}: GalaxySceneProps) {
  const [cameraTarget, setCameraTarget] = useState<THREE.Vector3 | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  const skillPositions = useMemo(() => {
    const positions: Record<string, THREE.Vector3> = {};
    const radius = 8;

    skills.forEach((skill, index) => {
      const angle = (index / skills.length) * Math.PI * 2;
      const height = (Math.random() - 0.5) * 6;
      const r = radius + (Math.random() - 0.5) * 4;

      positions[skill.id] = new THREE.Vector3(
        Math.cos(angle) * r,
        height,
        Math.sin(angle) * r
      );
    });

    return positions;
  }, [skills]);

  const connections = useMemo(() => {
    const conns: Array<{ start: THREE.Vector3; end: THREE.Vector3; color: string }> = [];

    skills.forEach((skill) => {
      skill.relatedSkills.forEach((relatedId) => {
        const relatedSkill = skills.find((s) => s.id === relatedId);
        if (relatedSkill && skillPositions[skill.id] && skillPositions[relatedId]) {
          const exists = conns.some(
            (c) =>
              (c.start.equals(skillPositions[skill.id]) &&
                c.end.equals(skillPositions[relatedId])) ||
              (c.start.equals(skillPositions[relatedId]) &&
                c.end.equals(skillPositions[skill.id]))
          );
          if (!exists) {
            conns.push({
              start: skillPositions[skill.id],
              end: skillPositions[relatedId],
              color: skill.color,
            });
          }
        }
      });
    });

    return conns;
  }, [skills, skillPositions]);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 2000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setAnimationProgress(progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, []);

  const handleSkillClick = useCallback(
    (skill: Skill) => {
      onSkillClick(skill);
      if (skillPositions[skill.id]) {
        setCameraTarget(skillPositions[skill.id].clone());
      }
    },
    [onSkillClick, skillPositions]
  );

  const handleCameraComplete = useCallback(() => {
    setCameraTarget(null);
  }, []);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4a90d9" />

      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />

      {connections.map((conn, index) => (
        <SkillConnection
          key={index}
          start={conn.start}
          end={conn.end}
          color={conn.color}
          animationProgress={animationProgress}
        />
      ))}

      {skills.map((skill) => (
        <SkillPlanet
          key={skill.id}
          skill={skill}
          position={skillPositions[skill.id]}
          isHovered={hoveredSkill === skill.id}
          isSelected={selectedSkill?.id === skill.id}
          onHover={onSkillHover}
          onClick={handleSkillClick}
          animationProgress={animationProgress}
        />
      ))}

      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={30}
        enableDamping
        dampingFactor={0.05}
      />

      <CameraController
        targetPosition={cameraTarget}
        onAnimationComplete={handleCameraComplete}
      />
    </>
  );
}

const SkillGalaxy = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [webglAvailable, setWebglAvailable] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("webgl2");
    if (!gl) {
      setWebglAvailable(false);
    }
  }, []);

  useEffect(() => {
    fetch("/data/skills.json")
      .then((res) => res.json())
      .then((data: SkillsData) => {
        setSkills(data.skills);
      })
      .catch((err) => console.error("Failed to load skills:", err));
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }, []);

  const handleSkillHover = useCallback((id: string | null) => {
    setHoveredSkill(id);
    if (!id) {
      document.body.style.cursor = "default";
    } else {
      document.body.style.cursor = "pointer";
    }
  }, []);

  const handleSkillClick = useCallback((skill: Skill) => {
    setSelectedSkill(skill);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedSkill(null);
  }, []);

  const hoveredSkillData = useMemo(
    () => skills.find((s) => s.id === hoveredSkill) || null,
    [skills, hoveredSkill]
  );

  return (
    <div className="skill-galaxy-section">
      <div className="skill-galaxy-header">
        <h2>
          Skills <span>Galaxy</span>
        </h2>
        <p>Explore my technical universe - hover over planets to discover skills</p>
      </div>

      <div className="skill-galaxy-container" ref={containerRef}>
        {webglAvailable ? (
          <>
            <Canvas
              camera={{ position: [0, 5, 15], fov: 60 }}
              onMouseMove={handleMouseMove}
              gl={{ antialias: true, alpha: true }}
            >
              <GalaxyScene
                skills={skills}
                onSkillClick={handleSkillClick}
                onSkillHover={handleSkillHover}
                hoveredSkill={hoveredSkill}
                selectedSkill={selectedSkill}
              />
            </Canvas>

            <Tooltip skill={hoveredSkillData} position={tooltipPosition} />

            <DetailPanel skill={selectedSkill} onClose={handleCloseDetail} />
          </>
        ) : (
          <div className="webgl-fallback">
            <p>WebGL is not available. Please enable hardware acceleration.</p>
          </div>
        )}
      </div>

      <div className="skill-galaxy-legend">
        {["frontend", "backend", "database", "ai", "cloud", "devops"].map((cat) => (
          <div key={cat} className="legend-item">
            <div
              className="legend-color"
              style={{
                backgroundColor:
                  cat === "frontend"
                    ? "#61DAFB"
                    : cat === "backend"
                    ? "#3776AB"
                    : cat === "database"
                    ? "#4479A1"
                    : cat === "ai"
                    ? "#EE4C2C"
                    : cat === "cloud"
                    ? "#FF9900"
                    : "#F05032",
              }}
            />
            <span>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillGalaxy;
