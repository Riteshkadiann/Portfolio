import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { TimelineEvent } from './types';

interface TimelineNodeProps {
  event: TimelineEvent;
  position: [number, number, number];
  rotation: [number, number, number];
  isActive: boolean;
  isHovered: boolean;
  progress: number;
  onHover: (event: TimelineEvent | null) => void;
  onClick: (event: TimelineEvent) => void;
}

export function TimelineNode({
  event,
  position,
  rotation,
  isActive,
  isHovered,
  progress,
  onHover,
  onClick,
}: TimelineNodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const cardRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const typeColors = {
    work: '#4CAF50',
    project: '#2196F3',
    education: '#9C27B0',
  };

  const color = typeColors[event.type];

  // 卡片材质
  const cardMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#1a1a2e',
      emissive: color,
      emissiveIntensity: isActive ? 0.3 : 0.05,
      roughness: 0.4,
      metalness: 0.6,
    });
  }, [color, isActive]);

  // 发光材质
  const glowMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: isActive ? 0.2 : 0.05,
      side: THREE.BackSide,
    });
  }, [color, isActive]);

  useFrame((state) => {
    if (groupRef.current && cardRef.current && glowRef.current) {
      // 激活状态的动画
      const targetScale = isActive || isHovered ? 1.1 : 1;
      cardRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
      glowRef.current.scale.lerp(
        new THREE.Vector3(targetScale * 1.2, targetScale * 1.2, targetScale * 1.2),
        0.1
      );

      // 悬浮动画
      const floatOffset = Math.sin(state.clock.elapsedTime * 2) * 0.05;
      groupRef.current.position.y = position[1] + floatOffset;

      // 发光脉冲
      if (isActive) {
        const pulse = 0.2 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
        glowMaterial.opacity = pulse;
      }
    }
  });

  // 根据进度计算显示状态
  const isVisible = progress > 0.1;

  if (!isVisible) return null;

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
    >
      {/* 发光外壳 */}
      <RoundedBox
        ref={glowRef}
        args={[4.2, 5.2, 0.3]}
        radius={0.2}
        material={glowMaterial}
      />

      {/* 主卡片 */}
      <RoundedBox
        ref={cardRef}
        args={[4, 5, 0.2]}
        radius={0.15}
        material={cardMaterial}
        onPointerEnter={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover(event);
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
          onClick(event);
        }}
      />

      {/* 年份标签 */}
      <Text
        position={[0, 2.2, 0.15]}
        fontSize={0.5}
        color={color}
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {event.year}
      </Text>

      {/* 类型标签 */}
      <Text
        position={[0, 1.6, 0.15]}
        fontSize={0.22}
        color="rgba(255,255,255,0.5)"
        anchorX="center"
        anchorY="middle"
      >
        {event.type.toUpperCase()}
      </Text>

      {/* 标题 */}
      <Text
        position={[0, 0.6, 0.15]}
        fontSize={0.32}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={3.8}
        textAlign="center"
        fontWeight="bold"
      >
        {event.title}
      </Text>

      {/* 公司/机构 */}
      <Text
        position={[0, -0.2, 0.15]}
        fontSize={0.24}
        color="rgba(255,255,255,0.7)"
        anchorX="center"
        anchorY="middle"
        maxWidth={3.8}
        textAlign="center"
      >
        {event.company}
      </Text>

      {/* 日期 */}
      <Text
        position={[0, -0.7, 0.15]}
        fontSize={0.18}
        color="rgba(255,255,255,0.4)"
        anchorX="center"
        anchorY="middle"
      >
        {event.date}
      </Text>

      {/* 技术标签预览 */}
      <group position={[0, -1.6, 0.15]}>
        {event.technologies.slice(0, 3).map((tech, index) => (
          <Text
            key={tech}
            position={[(index - 1) * 1.1, 0, 0]}
            fontSize={0.16}
            color={color}
            anchorX="center"
            anchorY="middle"
          >
            {tech}
          </Text>
        ))}
      </group>

      {/* 激活指示器 */}
      {isActive && (
        <mesh position={[0, -2.5, 0.2]}>
          <circleGeometry args={[0.15, 32]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )}

      {/* Hover Tooltip */}
      {(isHovered || hovered) && (
        <Html distanceFactor={10}>
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.9)',
              color: '#fff',
              padding: '12px 16px',
              borderRadius: '8px',
              border: `1px solid ${color}`,
              fontSize: '13px',
              maxWidth: '250px',
              pointerEvents: 'none',
              transform: 'translate(-50%, -120%)',
              boxShadow: `0 0 20px ${color}40`,
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px', color }}>
              {event.title}
            </div>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>
              {event.company} · {event.date}
            </div>
            <div style={{ fontSize: '11px', color: '#888', lineHeight: 1.4 }}>
              {event.description}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
