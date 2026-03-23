import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import type { Skill, SkillsData, PlanetData, ConnectionData } from './types';
import { SkillPlanet } from './SkillPlanet';
import { Connections } from './Connections';
import { Starfield } from './Starfield';
import './SkillGalaxy.css';

// 相机控制器组件
function CameraController({
  targetPosition,
  isAnimating,
}: {
  targetPosition: THREE.Vector3 | null;
  isAnimating: boolean;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useFrame(() => {
    if (targetPosition && isAnimating) {
      camera.position.lerp(targetPosition, 0.05);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), 0.05);
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={5}
      maxDistance={50}
      autoRotate={!isAnimating}
      autoRotateSpeed={0.5}
    />
  );
}

// 3D场景组件
function GalaxyScene({
  skillsData,
  onSkillSelect,
  selectedSkill,
  hoveredSkill,
  onSkillHover,
  entryProgress,
}: {
  skillsData: SkillsData;
  onSkillSelect: (skill: Skill) => void;
  selectedSkill: Skill | null;
  hoveredSkill: Skill | null;
  onSkillHover: (skill: Skill | null) => void;
  entryProgress: number;
}) {
  // 生成星球数据
  const planetsData = useMemo<PlanetData[]>(() => {
    return skillsData.skills.map((skill) => {
      // 根据分类分组分布
      const categoryIndex = Object.keys(skillsData.categories).indexOf(skill.category);
      const categoryCount = Object.keys(skillsData.categories).length;
      const angleOffset = (categoryIndex / categoryCount) * Math.PI * 2;
      
      // 在球形空间内随机分布，但按分类聚集
      const radius = 8 + Math.random() * 12;
      const theta = angleOffset + (Math.random() - 0.5) * 1.5;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      // 熟练度映射到大小 (0.3 - 1.0)
      const size = 0.3 + (skill.proficiency / 100) * 0.7;
      
      // 熟练度映射到发光强度
      const glowIntensity = 0.3 + (skill.proficiency / 100) * 0.7;
      
      return {
        skill,
        position: [x, y, z] as [number, number, number],
        size,
        glowIntensity,
      };
    });
  }, [skillsData]);

  // 生成连接线数据
  const connectionsData = useMemo<ConnectionData[]>(() => {
    const connections: ConnectionData[] = [];
    
    planetsData.forEach((planet) => {
      planet.skill.relatedSkills.forEach((relatedId) => {
        const relatedPlanet = planetsData.find((p) => p.skill.id === relatedId);
        if (relatedPlanet) {
          connections.push({
            from: planet.position,
            to: relatedPlanet.position,
            color: planet.skill.color,
          });
        }
      });
    });
    
    return connections;
  }, [planetsData]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 30]} fov={60} />
      <CameraController
        targetPosition={
          selectedSkill
            ? new THREE.Vector3(
                planetsData.find((p) => p.skill.id === selectedSkill.id)?.position[0] || 0,
                (planetsData.find((p) => p.skill.id === selectedSkill.id)?.position[1] || 0) + 5,
                (planetsData.find((p) => p.skill.id === selectedSkill.id)?.position[2] || 0) + 10
              )
            : null
        }
        isAnimating={!!selectedSkill}
      />
      
      {/* 环境光 */}
      <ambientLight intensity={0.2} />
      
      {/* 点光源 */}
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4444ff" />
      <pointLight position={[0, 0, 0]} intensity={0.8} color="#ffaa00" />
      
      {/* 星空背景 */}
      <Starfield count={3000} radius={80} />
      
      {/* 技能星球 */}
      {planetsData.map((planet) => (
        <SkillPlanet
          key={planet.skill.id}
          skill={planet.skill}
          position={planet.position}
          size={planet.size}
          glowIntensity={planet.glowIntensity}
          isHovered={hoveredSkill?.id === planet.skill.id}
          isSelected={selectedSkill?.id === planet.skill.id}
          onHover={onSkillHover}
          onClick={onSkillSelect}
          entryProgress={entryProgress}
        />
      ))}
      
      {/* 连接线 */}
      <Connections connections={connectionsData} entryProgress={entryProgress} />
    </>
  );
}

// 主组件
export function SkillGalaxy() {
  const [skillsData, setSkillsData] = useState<SkillsData | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [hoveredSkill, setHoveredSkill] = useState<Skill | null>(null);
  const [entryProgress, setEntryProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 加载技能数据
  useEffect(() => {
    fetch('/data/skills.json')
      .then((res) => res.json())
      .then((data) => {
        setSkillsData(data);
        setIsLoading(false);
        
        // 进入动画
        gsap.to(
          { value: 0 },
          {
            value: 1,
            duration: 2,
            ease: 'power2.out',
            onUpdate: function () {
              setEntryProgress(this.targets()[0].value);
            },
          }
        );
      })
      .catch((err) => {
        console.error('Failed to load skills data:', err);
        setIsLoading(false);
      });
  }, []);

  const handleSkillSelect = useCallback((skill: Skill) => {
    setSelectedSkill(skill);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedSkill(null);
  }, []);

  const handleSkillHover = useCallback((skill: Skill | null) => {
    setHoveredSkill(skill);
  }, []);

  if (isLoading || !skillsData) {
    return (
      <div className="skill-galaxy-loading">
        <div className="loading-spinner" />
        <p>加载技能星系...</p>
      </div>
    );
  }

  return (
    <div className="skill-galaxy-container">
      {/* 3D画布 */}
      <Canvas
        className="skill-galaxy-canvas"
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        <GalaxyScene
          skillsData={skillsData}
          onSkillSelect={handleSkillSelect}
          selectedSkill={selectedSkill}
          hoveredSkill={hoveredSkill}
          onSkillHover={handleSkillHover}
          entryProgress={entryProgress}
        />
      </Canvas>

      {/* 图例 */}
      <div className="skill-galaxy-legend">
        <h3>技能分类</h3>
        {Object.entries(skillsData.categories).map(([key, category]) => (
          <div key={key} className="legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: category.color }}
            />
            <span className="legend-name">{category.name}</span>
          </div>
        ))}
      </div>

      {/* 操作提示 */}
      <div className="skill-galaxy-hints">
        <p>🖱️ 拖拽旋转 | 滚轮缩放 | 点击查看详情</p>
      </div>

      {/* 技能详情面板 */}
      {selectedSkill && (
        <div className="skill-detail-panel">
          <button className="close-btn" onClick={handleCloseDetail}>
            ×
          </button>
          <div
            className="skill-header"
            style={{ borderColor: selectedSkill.color }}
          >
            <h2 style={{ color: selectedSkill.color }}>{selectedSkill.name}</h2>
            <div
              className="proficiency-badge"
              style={{ backgroundColor: selectedSkill.color }}
            >
              {selectedSkill.proficiency}%
            </div>
          </div>
          <div className="skill-category">
            {skillsData.categories[selectedSkill.category]?.name}
          </div>
          <p className="skill-description">{selectedSkill.description}</p>
          
          {selectedSkill.relatedSkills.length > 0 && (
            <div className="related-skills">
              <h4>相关技能</h4>
              <div className="related-tags">
                {selectedSkill.relatedSkills.map((skillId) => {
                  const relatedSkill = skillsData.skills.find((s) => s.id === skillId);
                  return relatedSkill ? (
                    <span
                      key={skillId}
                      className="related-tag"
                      style={{
                        backgroundColor: `${relatedSkill.color}30`,
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
          )}
        </div>
      )}
    </div>
  );
}

export default SkillGalaxy;
