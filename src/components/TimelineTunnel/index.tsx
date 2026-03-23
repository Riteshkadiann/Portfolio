import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { TimelineEvent, TimelineData, NodeData, DeviceType } from './types';
import { TimelineNode } from './TimelineNode';
import { TunnelWalls } from './TunnelWalls';
import './TimelineTunnel.css';

gsap.registerPlugin(ScrollTrigger);



// 相机控制器
function CameraController({
  progress,
  mouseOffset,
  deviceType,
}: {
  progress: number;
  mouseOffset: { x: number; y: number };
  deviceType: DeviceType;
}) {
  const { camera } = useThree();
  const targetZ = useRef(0);
  const targetX = useRef(0);
  const targetY = useRef(0);

  useFrame(() => {
    const tunnelLength = 40; // 减小隧道长度
    
    if (deviceType === 'mobile') {
      // 移动端：垂直滚动效果
      targetZ.current = 15;
      targetY.current = (progress - 0.5) * tunnelLength * 0.3;
      targetX.current = 0;
    } else {
      // 桌面端：隧道穿越效果 - 相机更靠近节点
      targetZ.current = (0.5 - progress) * tunnelLength * 0.8;
      targetX.current = mouseOffset.x * 1.5;
      targetY.current = mouseOffset.y * 1.5;
    }

    camera.position.z += (targetZ.current - camera.position.z) * 0.08;
    camera.position.x += (targetX.current - camera.position.x) * 0.08;
    camera.position.y += (targetY.current - camera.position.y) * 0.08;
    
    // 相机始终看向Z轴负方向
    camera.lookAt(camera.position.x * 0.3, camera.position.y * 0.3, camera.position.z - 20);
  });

  return null;
}

// 3D场景
function TunnelScene({
  timelineData,
  progress,
  mouseOffset,
  deviceType,
  onNodeSelect,
  hoveredNode,
  onNodeHover,
}: {
  timelineData: TimelineData;
  progress: number;
  mouseOffset: { x: number; y: number };
  deviceType: DeviceType;
  onNodeSelect: (event: TimelineEvent) => void;
  hoveredNode: TimelineEvent | null;
  onNodeHover: (event: TimelineEvent | null) => void;
}) {
  const tunnelLength = 35; // 减小隧道长度，减少空白
  const nodeSpacing = tunnelLength / (timelineData.events.length - 1); // 均匀分布

  // 生成节点数据
  const nodesData = useMemo<NodeData[]>(() => {
    return timelineData.events.map((event, index) => {
      // 反转顺序：最新的在前(正Z)，最旧的在后(负Z)
      const z = (timelineData.events.length - 1 - index) * nodeSpacing - tunnelLength / 2;
      
      if (deviceType === 'mobile') {
        // 移动端：垂直排列
        return {
          event,
          position: [0, index * 8 - (timelineData.events.length * 4), 0] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
        };
      } else {
        // 桌面端：隧道壁上排列，交替左右
        const angle = (index % 2 === 0 ? 1 : -1) * (Math.PI / 3);
        const radius = 5;
        const x = Math.sin(angle) * radius;
        const y = Math.cos(angle) * radius * 0.2;
        
        return {
          event,
          position: [x, y, z] as [number, number, number],
          rotation: [0, 0, -angle * 0.3] as [number, number, number],
        };
      }
    });
  }, [timelineData.events, nodeSpacing, deviceType, tunnelLength]);

  // 计算活跃节点
  const activeNodeIndex = useMemo(() => {
    return Math.floor(progress * timelineData.events.length);
  }, [progress, timelineData.events.length]);

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, 0, deviceType === 'mobile' ? 20 : 25]}
        fov={deviceType === 'mobile' ? 50 : 60}
      />
      <CameraController
        progress={progress}
        mouseOffset={mouseOffset}
        deviceType={deviceType}
      />

      {/* 环境光 */}
      <ambientLight intensity={0.3} />
      
      {/* 点光源 */}
      <pointLight position={[10, 10, 0]} intensity={0.8} color="#00d4ff" />
      <pointLight position={[-10, -10, 0]} intensity={0.5} color="#ff00d4" />
      <pointLight position={[0, 0, 10]} intensity={1} color="#ffffff" />

      {/* 隧道壁 */}
      {deviceType !== 'mobile' && (
        <TunnelWalls
          tunnelLength={tunnelLength}
          progress={progress}
        />
      )}

      {/* 年份标记 */}
      {[2020, 2021, 2022, 2023, 2024].map((year, index) => {
        const z = (1 - index / 4) * tunnelLength - tunnelLength / 2;
        if (deviceType === 'mobile') {
          return (
            <Text
              key={year}
              position={[0, index * 8 - 16, -2]}
              fontSize={1.2}
              color="#00d4ff"
              anchorX="center"
              anchorY="middle"
            >
              {year}
            </Text>
          );
        }
        return (
          <Text
            key={year}
            position={[0, 5.5, z]}
            fontSize={1}
            color="#00d4ff"
            anchorX="center"
            anchorY="middle"
          >
            {year}
          </Text>
        );
      })}

      {/* 时间轴节点 */}
      {nodesData.map((node, index) => (
        <TimelineNode
          key={node.event.id}
          event={node.event}
          position={node.position}
          rotation={node.rotation}
          isActive={index === activeNodeIndex}
          isHovered={hoveredNode?.id === node.event.id}
          progress={progress}
          onHover={onNodeHover}
          onClick={onNodeSelect}
        />
      ))}

      {/* 连接线 - 粒子流效果 */}
      {deviceType !== 'mobile' && (
        <ParticleStream count={200} tunnelLength={tunnelLength} progress={progress} />
      )}
    </>
  );
}

// 粒子流组件
function ParticleStream({
  count,
  tunnelLength,
  progress,
}: {
  count: number;
  tunnelLength: number;
  progress: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);

  const { geometry } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const t = i / count;
      const angle = t * Math.PI * 8;
      const radius = 7;
      const z = (t - 0.5) * tunnelLength;
      
      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = Math.sin(angle) * radius;
      positions[i3 + 2] = z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return { positions, geometry: geo };
  }, [count, tunnelLength]);

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      color: '#00d4ff',
      size: 0.15,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.z += 0.002;
      
      // 根据进度调整透明度
      const zPositions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      const cameraZ = (0.5 - progress) * tunnelLength;
      
      // 高亮相机附近的粒子
      const colors = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const z = zPositions[i * 3 + 2];
        const dist = Math.abs(z - cameraZ);
        const intensity = Math.max(0, 1 - dist / 10);
        
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 0.8 + intensity * 0.2;
        colors[i * 3 + 2] = 1;
      }
      
      pointsRef.current.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      material.vertexColors = true;
    }
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

// 主组件
export function TimelineTunnel() {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [progress, setProgress] = useState(0);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [selectedNode, setSelectedNode] = useState<TimelineEvent | null>(null);
  const [hoveredNode, setHoveredNode] = useState<TimelineEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // 检测设备类型
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // 加载时间轴数据
  useEffect(() => {
    fetch('/data/timeline.json')
      .then((res) => res.json())
      .then((data) => {
        setTimelineData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load timeline data:', err);
        setIsLoading(false);
      });
  }, []);

  // 设置滚动动画 - 使用requestAnimationFrame监听滚动
  useEffect(() => {
    if (!containerRef.current || !timelineData) return;

    const container = containerRef.current;
    const handleScroll = () => {
      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const containerHeight = container.offsetHeight;
      
      // 计算进度：当容器顶部进入视口开始到容器底部离开视口
      const scrollProgress = Math.max(0, Math.min(1, 
        (-rect.top + windowHeight * 0.5) / (containerHeight - windowHeight * 0.5)
      ));
      
      setProgress(scrollProgress);
    };

    // 使用GSAP的ticker来平滑更新
    const updateProgress = () => {
      handleScroll();
    };
    
    gsap.ticker.add(updateProgress);
    
    // 初始调用一次
    handleScroll();

    return () => {
      gsap.ticker.remove(updateProgress);
    };
  }, [timelineData]);

  // 鼠标移动处理（视差效果）
  useEffect(() => {
    if (deviceType === 'mobile') return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMouseOffset({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [deviceType]);

  const handleNodeSelect = useCallback((event: TimelineEvent) => {
    setSelectedNode(event);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleNodeHover = useCallback((event: TimelineEvent | null) => {
    setHoveredNode(event);
  }, []);

  if (isLoading || !timelineData) {
    return (
      <div className="timeline-tunnel-loading">
        <div className="loading-spinner" />
        <p>加载时间轴...</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="timeline-tunnel-container"
      style={{ height: `${Math.max(200, timelineData.events.length * 60)}vh` }}
    >
      {/* 3D画布 - 固定在视口 */}
      <div className="timeline-tunnel-canvas-wrapper">
        <Canvas
          className="timeline-tunnel-canvas"
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          }}
          dpr={[1, 2]}
        >
          <TunnelScene
            timelineData={timelineData}
            progress={progress}
            mouseOffset={mouseOffset}
            deviceType={deviceType}
            onNodeSelect={handleNodeSelect}
            hoveredNode={hoveredNode}
            onNodeHover={handleNodeHover}
          />
        </Canvas>

        {/* 进度指示器 */}
        <div className="timeline-progress">
          <div
            className="timeline-progress-bar"
            style={{ height: `${progress * 100}%` }}
          />
        </div>

        {/* 操作提示 */}
        <div className="timeline-hints">
          <p>
            {deviceType === 'mobile'
              ? '👆 上下滑动浏览时间轴'
              : '🖱️ 滚动穿越时间隧道 | 移动鼠标产生视差'}
          </p>
        </div>
      </div>

      {/* 详情模态框 */}
      {selectedNode && (
        <div className="timeline-modal-overlay" onClick={handleCloseDetail}>
          <div
            className="timeline-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close-btn" onClick={handleCloseDetail}>
              ×
            </button>

            <div className="modal-header">
              <span
                className={`modal-type ${selectedNode.type}`}
              >
                {selectedNode.type}
              </span>
              <span className="modal-date">{selectedNode.date}</span>
            </div>

            <h2 className="modal-title">{selectedNode.title}</h2>
            <p className="modal-company">{selectedNode.company}</p>

            <div className="modal-section">
              <h3>项目描述</h3>
              <p>{selectedNode.details}</p>
            </div>

            <div className="modal-section">
              <h3>技术栈</h3>
              <div className="tech-tags">
                {selectedNode.technologies.map((tech) => (
                  <span key={tech} className="tech-tag">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="modal-section">
              <h3>主要成就</h3>
              <ul className="achievement-list">
                {selectedNode.achievements.map((achievement, index) => (
                  <li key={index}>{achievement}</li>
                ))}
              </ul>
            </div>

            {selectedNode.github && (
              <a
                href={selectedNode.github}
                target="_blank"
                rel="noopener noreferrer"
                className="github-link"
              >
                查看 GitHub →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TimelineTunnel;
