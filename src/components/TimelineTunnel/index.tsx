import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Stars, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import timelineData from '../../data/timeline.json';
import { TimelineItem } from '../../types';
import './TimelineTunnel.css';

gsap.registerPlugin(ScrollTrigger);

interface TimelineCardProps {
  item: TimelineItem;
  position: THREE.Vector3;
  isActive: boolean;
  onClick: (item: TimelineItem) => void;
}

function TimelineCard({ item, position, isActive, onClick }: TimelineCardProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.lerp(position, 0.05);
      
      const lookAtPos = new THREE.Vector3(0, position.y, position.z);
      groupRef.current.lookAt(lookAtPos);
      
      const scale = isActive ? 1.2 : hovered ? 1.1 : 1;
      groupRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }
  });

  const getTypeColor = () => {
    switch (item.type) {
      case 'work':
        return '#5eead4';
      case 'project':
        return '#ff6b6b';
      case 'education':
        return '#4ecdc4';
      default:
        return '#5eead4';
    }
  };

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick(item);
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[4, 2.5]} />
        <meshStandardMaterial
          color={isActive ? '#1a1f2e' : '#0d1321'}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[3.8, 2.3]} />
        <meshBasicMaterial
          color={getTypeColor()}
          transparent
          opacity={isActive ? 0.15 : 0.05}
        />
      </mesh>

      <group position={[0, 0.6, 0.02]}>
        <Text
          fontSize={0.3}
          color={getTypeColor()}
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {item.year}
        </Text>
      </group>

      <group position={[0, 0.1, 0.02]}>
        <Text
          fontSize={0.22}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          maxWidth={3.5}
          textAlign="center"
        >
          {item.title}
        </Text>
      </group>

      <group position={[0, -0.3, 0.02]}>
        <Text
          fontSize={0.14}
          color="rgba(255,255,255,0.7)"
          anchorX="center"
          anchorY="middle"
        >
          {item.company}
        </Text>
      </group>

      <group position={[0, -0.8, 0.02]}>
        {item.tags.slice(0, 3).map((tag, index) => (
          <group key={tag} position={[(index - 1) * 1.1, 0, 0]}>
            <mesh>
              <planeGeometry args={[1, 0.25]} />
              <meshBasicMaterial
                color={getTypeColor()}
                transparent
                opacity={0.2}
              />
            </mesh>
            <Text
              fontSize={0.1}
              color={getTypeColor()}
              anchorX="center"
              anchorY="middle"
            >
              {tag}
            </Text>
          </group>
        ))}
      </group>

      {isActive && (
        <mesh position={[0, 0, -0.1]}>
          <planeGeometry args={[4.4, 2.9]} />
          <meshBasicMaterial
            color={getTypeColor()}
            transparent
            opacity={0.3}
          />
        </mesh>
      )}
    </group>
  );
}

interface YearMarkerProps {
  year: string;
  position: THREE.Vector3;
}

function YearMarker({ year, position }: YearMarkerProps) {
  return (
    <group position={position}>
      <Text
        fontSize={0.5}
        color="#5eead4"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {year}
      </Text>
    </group>
  );
}

interface ParticleStreamProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
  progress: number;
}

function ParticleStream({ start, end, progress }: ParticleStreamProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 50;

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      pos[i * 3] = start.x + (end.x - start.x) * t;
      pos[i * 3 + 1] = start.y + (end.y - start.y) * t;
      pos[i * 3 + 2] = start.z + (end.z - start.z) * t;
    }
    return pos;
  }, [start, end]);

  useFrame(() => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const t = ((i / particleCount + progress) % 1);
        positions[i * 3] = start.x + (end.x - start.x) * t;
        positions[i * 3 + 1] = start.y + (end.y - start.y) * t + Math.sin(t * Math.PI * 4) * 0.5;
        positions[i * 3 + 2] = start.z + (end.z - start.z) * t;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#5eead4"
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

interface TunnelProps {
  radius: number;
  length: number;
  segments: number;
}

function Tunnel({ radius, length, segments }: TunnelProps) {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -length / 2]}>
        <cylinderGeometry args={[radius, radius, length, segments, 1, true]} />
        <meshStandardMaterial
          color="#0a0e17"
          side={THREE.BackSide}
          transparent
          opacity={0.5}
        />
      </mesh>
      
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh
          key={i}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, 0, -i * (length / 20)]}
        >
          <torusGeometry args={[radius, 0.02, 16, segments]} />
          <meshBasicMaterial
            color="#5eead4"
            transparent
            opacity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

interface TimelineModalProps {
  item: TimelineItem | null;
  onClose: () => void;
}

function TimelineModal({ item, onClose }: TimelineModalProps) {
  if (!item) return null;

  const getTypeColor = () => {
    switch (item.type) {
      case 'work':
        return '#5eead4';
      case 'project':
        return '#ff6b6b';
      case 'education':
        return '#4ecdc4';
      default:
        return '#5eead4';
    }
  };

  const getTypeLabel = () => {
    switch (item.type) {
      case 'work':
        return '工作经历';
      case 'project':
        return '项目经验';
      case 'education':
        return '教育背景';
      default:
        return '其他';
    }
  };

  return (
    <div className="timeline-modal-overlay" onClick={onClose}>
      <div className="timeline-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          ×
        </button>
        
        <div className="modal-header">
          <div
            className="modal-type-badge"
            style={{ backgroundColor: getTypeColor() }}
          >
            {getTypeLabel()}
          </div>
          <span className="modal-year">{item.year}</span>
        </div>

        <h2 className="modal-title">{item.title}</h2>
        <h3 className="modal-company">{item.company}</h3>

        <div className="modal-image-container">
          <img
            src={item.image}
            alt={item.title}
            className="modal-image"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/preview.png';
            }}
          />
        </div>

        <p className="modal-description">{item.description}</p>

        <div className="modal-tags">
          <h4>技术栈</h4>
          <div className="modal-tag-list">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="modal-tag"
                style={{
                  backgroundColor: `${getTypeColor()}20`,
                  borderColor: getTypeColor(),
                  color: getTypeColor(),
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface TimelineSceneProps {
  activeIndex: number;
  onCardClick: (item: TimelineItem) => void;
  isMobile: boolean;
}

function TimelineScene({ activeIndex, onCardClick, isMobile }: TimelineSceneProps) {
  const { camera } = useThree();
  const items = timelineData as TimelineItem[];
  const containerRef = useRef<HTMLDivElement>(null);
  const [particleProgress, setParticleProgress] = useState(0);

  const cardPositions = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const radius = 8;
    const depthStep = 8;
    
    items.forEach((_, index) => {
      const angle = (index * Math.PI * 2) / items.length + Math.PI;
      const depth = -index * depthStep;
      positions.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle * 0.5) * 2,
          depth
        )
      );
    });
    return positions;
  }, []);

  const yearMarkers = useMemo(() => {
    const markers: { year: string; position: THREE.Vector3 }[] = [];
    const uniqueYears = [...new Set(items.map(item => item.year))];
    
    uniqueYears.forEach((year, index) => {
      markers.push({
        year,
        position: new THREE.Vector3(0, 5, -index * 16 - 8),
      });
    });
    return markers;
  }, []);

  useFrame((state, delta) => {
    setParticleProgress((prev) => (prev + delta * 0.5) % 1);
    
    if (!isMobile) {
      const targetZ = -activeIndex * 8;
      camera.position.z += (targetZ - camera.position.z) * 0.05;
      
      const mouseX = (state.mouse.x * Math.PI) / 8;
      const mouseY = (state.mouse.y * Math.PI) / 8;
      camera.rotation.x += (mouseY - camera.rotation.x) * 0.05;
      camera.rotation.y += (mouseX - camera.rotation.y) * 0.05;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#5eead4" />
      
      <Stars radius={50} depth={100} count={3000} factor={4} saturation={0} fade speed={0.5} />
      
      <Tunnel radius={12} length={100} segments={32} />
      
      {yearMarkers.map((marker) => (
        <YearMarker
          key={marker.year}
          year={marker.year}
          position={marker.position}
        />
      ))}
      
      {items.map((item, index) => (
        <TimelineCard
          key={item.id}
          item={item}
          position={cardPositions[index]}
          isActive={index === activeIndex}
          onClick={onCardClick}
        />
      ))}
      
      {cardPositions.slice(0, -1).map((pos, index) => (
        <ParticleStream
          key={index}
          start={pos}
          end={cardPositions[index + 1]}
          progress={particleProgress}
        />
      ))}
    </>
  );
}

export default function TimelineTunnel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useGSAP(() => {
    if (isMobile || !containerRef.current) return;

    const items = timelineData;
    const sectionHeight = window.innerHeight;

    items.forEach((_, index) => {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: () => `top+=${index * sectionHeight} top`,
        end: () => `top+=${(index + 1) * sectionHeight} top`,
        onEnter: () => setActiveIndex(index),
        onEnterBack: () => setActiveIndex(index),
      });
    });
  }, [isMobile]);

  const handleCardClick = useCallback((item: TimelineItem) => {
    setSelectedItem(item);
  }, []);

  const handleMobileScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (isMobile) {
      const scrollTop = (e.target as HTMLDivElement).scrollTop;
      const itemHeight = 300;
      const newIndex = Math.floor(scrollTop / itemHeight);
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < timelineData.length) {
        setActiveIndex(newIndex);
      }
    }
  }, [isMobile, activeIndex]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'work':
        return '#5eead4';
      case 'project':
        return '#ff6b6b';
      case 'education':
        return '#4ecdc4';
      default:
        return '#5eead4';
    }
  };

  return (
    <div className="timeline-tunnel" ref={containerRef}>
      <div className="tunnel-header">
        <h2 className="tunnel-title">时间轴</h2>
        <p className="tunnel-subtitle">我的职业旅程</p>
      </div>

      {!isMobile ? (
        <div className="tunnel-canvas-container">
          <Canvas
            camera={{ position: [0, 0, 5], fov: 75 }}
            gl={{ antialias: true, alpha: true }}
          >
            <TimelineScene
              activeIndex={activeIndex}
              onCardClick={handleCardClick}
              isMobile={isMobile}
            />
          </Canvas>
          
          <div className="scroll-indicator">
            <div className="scroll-icon">
              <div className="scroll-dot" />
            </div>
            <span>向下滚动探索</span>
          </div>
        </div>
      ) : (
        <div
          className="mobile-timeline"
          onScroll={handleMobileScroll}
        >
          {timelineData.map((item, index) => (
            <div
              key={item.id}
              className={`mobile-timeline-item ${index === activeIndex ? 'active' : ''}`}
              onClick={() => handleCardClick(item)}
            >
              <div
                className="timeline-item-indicator"
                style={{ backgroundColor: getTypeColor(item.type) }}
              />
              <div className="timeline-item-content">
                <div className="timeline-item-header">
                  <span className="timeline-item-year">{item.year}</span>
                  <span
                    className="timeline-item-type"
                    style={{ color: getTypeColor(item.type) }}
                  >
                    {item.type === 'work' ? '工作' : item.type === 'project' ? '项目' : '教育'}
                  </span>
                </div>
                <h3 className="timeline-item-title">{item.title}</h3>
                <p className="timeline-item-company">{item.company}</p>
                <div className="timeline-item-tags">
                  {item.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="timeline-item-tag"
                      style={{
                        backgroundColor: `${getTypeColor(item.type)}20`,
                        color: getTypeColor(item.type),
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TimelineModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
