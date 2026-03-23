import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Skill } from './types';

interface SkillPlanetProps {
  skill: Skill;
  position: [number, number, number];
  size: number;
  glowIntensity: number;
  isHovered: boolean;
  isSelected: boolean;
  onHover: (skill: Skill | null) => void;
  onClick: (skill: Skill) => void;
  entryProgress: number;
}

export function SkillPlanet({
  skill,
  position,
  size,
  glowIntensity,
  isHovered,
  isSelected,
  onHover,
  onClick,
  entryProgress,
}: SkillPlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const currentPosition = useMemo(() => {
    return [
      position[0] * entryProgress,
      position[1] * entryProgress,
      position[2] * entryProgress,
    ] as [number, number, number];
  }, [position, entryProgress]);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: skill.color,
      emissive: skill.color,
      emissiveIntensity: glowIntensity * 0.5,
      roughness: 0.3,
      metalness: 0.7,
    });
  }, [skill.color, glowIntensity]);

  const glowMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: skill.color,
      transparent: true,
      opacity: 0.3 * glowIntensity,
      side: THREE.BackSide,
    });
  }, [skill.color, glowIntensity]);

  useFrame((state) => {
    if (meshRef.current && glowRef.current) {
      const scale = isHovered || isSelected ? 1.5 : 1;
      const targetScale = size * scale;
      
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
      
      glowRef.current.scale.lerp(
        new THREE.Vector3(targetScale * 1.5, targetScale * 1.5, targetScale * 1.5),
        0.1
      );

      // 自转动画
      meshRef.current.rotation.y += 0.01;
      meshRef.current.rotation.x += 0.005;

      // 悬浮动画
      const floatOffset = Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1;
      meshRef.current.position.y = currentPosition[1] + floatOffset;
      glowRef.current.position.y = currentPosition[1] + floatOffset;
    }
  });

  return (
    <group position={currentPosition}>
      {/* 发光外壳 */}
      <Sphere
        ref={glowRef}
        args={[1, 32, 32]}
        material={glowMaterial}
      />
      
      {/* 主星球 */}
      <Sphere
        ref={meshRef}
        args={[1, 32, 32]}
        material={material}
        onPointerEnter={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover(skill);
          document.body.style.cursor = 'pointer';
        }}
        onPointerLeave={(e) => {
          e.stopPropagation();
          setHovered(false);
          onHover(null);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(skill);
        }}
      />

      {/* Tooltip */}
      {(isHovered || hovered) && (
        <Html distanceFactor={10}>
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.9)',
              color: '#fff',
              padding: '12px 16px',
              borderRadius: '8px',
              border: `1px solid ${skill.color}`,
              fontSize: '14px',
              minWidth: '150px',
              pointerEvents: 'none',
              transform: 'translate(-50%, -120%)',
              boxShadow: `0 0 20px ${skill.color}40`,
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px', color: skill.color }}>
              {skill.name}
            </div>
            <div style={{ fontSize: '12px', color: '#aaa' }}>
              熟练度: {skill.proficiency}%
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              {skill.category}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
