import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Line, Float } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import skillsData from '../../data/skills.json';
import { Skill } from '../../types';
import './SkillGalaxy.css';

interface SkillPlanetProps {
  skill: Skill;
  position: THREE.Vector3;
  isHovered: boolean;
  isSelected: boolean;
  onHover: (skill: Skill | null) => void;
  onClick: (skill: Skill) => void;
  animationProgress: number;
}

function SkillPlanet({ skill, position, isHovered, isSelected, onHover, onClick, animationProgress }: SkillPlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const initialScale = (skill.proficiency / 100) * 0.8 + 0.4;
  const targetScale = isHovered || isSelected ? initialScale * 1.5 : initialScale;

  useFrame((state) => {
    if (meshRef.current) {
      const animatedPosition = position.clone().multiplyScalar(animationProgress);
      meshRef.current.position.lerp(animatedPosition, 0.1);
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      meshRef.current.rotation.y += 0.005;
    }
    if (glowRef.current) {
      const glowScale = targetScale * 1.3;
      glowRef.current.scale.set(glowScale, glowScale, glowScale);
      const glowMaterial = glowRef.current.material as THREE.MeshBasicMaterial;
      glowMaterial.opacity = isHovered || isSelected ? 0.6 : 0.3;
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(skill);
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          onClick(skill);
        }}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={skill.color}
          emissive={skill.color}
          emissiveIntensity={isHovered || isSelected ? 0.8 : 0.4}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={skill.color}
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

interface ConnectionLineProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
  animationProgress: number;
}

function ConnectionLine({ start, end, color, animationProgress }: ConnectionLineProps) {
  const lineRef = useRef<THREE.Line>(null);

  useFrame(() => {
    if (lineRef.current && animationProgress > 0.5) {
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      material.opacity = Math.min(1, (animationProgress - 0.5) * 2);
    }
  });

  const points = useMemo(() => {
    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    midPoint.y += 2;
    return [start, midPoint, end];
  }, [start, end]);

  return (
    <Line
      ref={lineRef}
      points={points}
      color={color}
      lineWidth={2}
      transparent
      opacity={0}
      dashed
      dashSize={0.5}
      gapSize={0.2}
    />
  );
}

interface SkillTooltipProps {
  skill: Skill | null;
  position: { x: number; y: number };
}

function SkillTooltip({ skill, position }: SkillTooltipProps) {
  if (!skill) return null;

  return (
    <div
      className="skill-tooltip"
      style={{
        left: position.x + 20,
        top: position.y - 20,
      }}
    >
      <div className="tooltip-header">
        <div
          className="tooltip-color-indicator"
          style={{ backgroundColor: skill.color }}
        />
        <h3>{skill.name}</h3>
      </div>
      <div className="tooltip-proficiency">
        <div className="proficiency-bar">
          <div
            className="proficiency-fill"
            style={{
              width: `${skill.proficiency}%`,
              backgroundColor: skill.color,
            }}
          />
        </div>
        <span>{skill.proficiency}%</span>
      </div>
      <p className="tooltip-category">{skill.category}</p>
    </div>
  );
}

interface SkillDetailPanelProps {
  skill: Skill | null;
  onClose: () => void;
}

function SkillDetailPanel({ skill, onClose }: SkillDetailPanelProps) {
  if (!skill) return null;

  return (
    <div className="skill-detail-overlay" onClick={onClose}>
      <div className="skill-detail-panel" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
        <div className="detail-header">
          <div
            className="detail-icon"
            style={{ backgroundColor: skill.color }}
          >
            {skill.name.charAt(0)}
          </div>
          <div className="detail-info">
            <h2>{skill.name}</h2>
            <span className="detail-category">{skill.category}</span>
          </div>
        </div>
        <div className="detail-proficiency">
          <h4>熟练度</h4>
          <div className="proficiency-bar-large">
            <div
              className="proficiency-fill-large"
              style={{
                width: `${skill.proficiency}%`,
                backgroundColor: skill.color,
              }}
            />
            <span className="proficiency-text">{skill.proficiency}%</span>
          </div>
        </div>
        <div className="detail-description">
          <h4>描述</h4>
          <p>{skill.description}</p>
        </div>
        <div className="detail-related">
          <h4>相关技能</h4>
          <div className="related-skills">
            {skill.relatedSkills.map((relatedId) => {
              const relatedSkill = skillsData.find((s) => s.id === relatedId);
              return relatedSkill ? (
                <span
                  key={relatedId}
                  className="related-skill-tag"
                  style={{
                    backgroundColor: `${relatedSkill.color}20`,
                    borderColor: relatedSkill.color,
                    color: relatedSkill.color,
                  }}
                >
                  {relatedSkill.name}
                </span>
              ) : null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function CameraController({ targetSkill, controlsRef }: { targetSkill: Skill | null; controlsRef: React.RefObject<any> }) {
  const { camera } = useThree();

  useEffect(() => {
    if (targetSkill && controlsRef.current) {
      const targetPosition = new THREE.Vector3(0, 0, 15);
      gsap.to(camera.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration: 1,
        ease: 'outCubic',
      });
    }
  }, [targetSkill, camera, controlsRef]);

  return null;
}

interface SkillGalaxySceneProps {
  hoveredSkill: Skill | null;
  selectedSkill: Skill | null;
  onSkillHover: (skill: Skill | null) => void;
  onSkillSelect: (skill: Skill) => void;
  animationProgress: number;
  controlsRef: React.RefObject<any>;
}

function SkillGalaxyScene({
  hoveredSkill,
  selectedSkill,
  onSkillHover,
  onSkillSelect,
  animationProgress,
  controlsRef,
}: SkillGalaxySceneProps) {
  const skills = skillsData as Skill[];

  const positions = useMemo(() => {
    const pos: { [key: string]: THREE.Vector3 } = {};
    skills.forEach((skill, index) => {
      const phi = Math.acos(-1 + (2 * index) / skills.length);
      const theta = Math.sqrt(skills.length * Math.PI) * phi;
      const radius = 12 + Math.random() * 3;
      pos[skill.id] = new THREE.Vector3(
        radius * Math.cos(theta) * Math.sin(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(phi)
      );
    });
    return pos;
  }, []);

  const connections = useMemo(() => {
    const conn: { start: THREE.Vector3; end: THREE.Vector3; color: string }[] = [];
    skills.forEach((skill) => {
      skill.relatedSkills.forEach((relatedId) => {
        if (positions[skill.id] && positions[relatedId] && skill.id < relatedId) {
          conn.push({
            start: positions[skill.id],
            end: positions[relatedId],
            color: skill.color,
          });
        }
      });
    });
    return conn;
  }, [positions]);

  return (
    <>
      <CameraController targetSkill={selectedSkill} controlsRef={controlsRef} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#5eead4" />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      {connections.map((conn, index) => (
        <ConnectionLine
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
          position={positions[skill.id]}
          isHovered={hoveredSkill?.id === skill.id}
          isSelected={selectedSkill?.id === skill.id}
          onHover={onSkillHover}
          onClick={onSkillSelect}
          animationProgress={animationProgress}
        />
      ))}
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={40}
        autoRotate={!selectedSkill}
        autoRotateSpeed={0.5}
      />
    </>
  );
}

export default function SkillGalaxy() {
  const [hoveredSkill, setHoveredSkill] = useState<Skill | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [animationProgress, setAnimationProgress] = useState(0);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const progressObj = { progress: 0 };
    gsap.to(progressObj, {
      progress: 1,
      duration: 2,
      ease: 'outQuad',
      onUpdate: () => {
        setAnimationProgress(progressObj.progress);
      },
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }, []);

  return (
    <div className="skill-galaxy" onMouseMove={handleMouseMove}>
      <div className="galaxy-header">
        <h2 className="galaxy-title">技能星系</h2>
        <p className="galaxy-subtitle">点击星球探索技能详情</p>
      </div>
      <div className="galaxy-canvas-container">
        <Canvas
          camera={{ position: [0, 0, 25], fov: 60 }}
          gl={{ antialias: true, alpha: true }}
        >
          <SkillGalaxyScene
            hoveredSkill={hoveredSkill}
            selectedSkill={selectedSkill}
            onSkillHover={setHoveredSkill}
            onSkillSelect={setSelectedSkill}
            animationProgress={animationProgress}
            controlsRef={controlsRef}
          />
        </Canvas>
      </div>
      <SkillTooltip skill={hoveredSkill} position={tooltipPosition} />
      <SkillDetailPanel skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
    </div>
  );
}
