import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TunnelWallsProps {
  tunnelLength: number;
  progress: number;
}

export function TunnelWalls({ tunnelLength, progress }: TunnelWallsProps) {
  const tunnelRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const radius = 8;
  const segments = 32;

  // 创建隧道几何体
  const tunnelGeometry = useMemo(() => {
    const geometry = new THREE.CylinderGeometry(radius, radius, tunnelLength, segments, 20, true);
    geometry.rotateX(Math.PI / 2);
    return geometry;
  }, [radius, tunnelLength, segments]);

  // 隧道材质 - 网格效果
  const tunnelMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color('#1a1a3e') },
        gridColor: { value: new THREE.Color('#00d4ff') },
        progress: { value: 0 },
        opacity: { value: 0.3 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vDepth;
        void main() {
          vUv = uv;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vDepth = -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform vec3 gridColor;
        uniform float progress;
        uniform float opacity;
        varying vec2 vUv;
        varying float vDepth;
        
        void main() {
          // 创建网格线
          float gridX = step(0.95, fract(vUv.x * 16.0));
          float gridY = step(0.98, fract(vUv.y * 40.0));
          float grid = max(gridX, gridY);
          
          // 深度渐变
          float depthFade = smoothstep(50.0, 0.0, vDepth);
          
          // 进度高亮
          float progressGlow = smoothstep(progress - 0.1, progress, vUv.y) * 
                              smoothstep(progress + 0.1, progress, vUv.y);
          
          vec3 finalColor = mix(color, gridColor, grid * 0.5 + progressGlow * 0.3);
          float finalOpacity = (0.1 + grid * 0.2 + progressGlow * 0.1) * opacity * depthFade;
          
          gl_FragColor = vec4(finalColor, finalOpacity);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  // 年份标记
  const yearMarkers = useMemo(() => {
    const markers = [];
    const years = [2020, 2021, 2022, 2023, 2024];
    
    for (let i = 0; i < years.length; i++) {
      const z = (i / (years.length - 1)) * tunnelLength - tunnelLength / 2;
      markers.push({
        year: years[i],
        position: [0, radius - 0.5, z] as [number, number, number],
      });
    }
    return markers;
  }, [tunnelLength, radius]);

  // 粒子流
  const particleData = useMemo(() => {
    const count = 500;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const r = radius * 0.8 + Math.random() * 1;
      
      positions[i3] = Math.cos(angle) * r;
      positions[i3 + 1] = Math.sin(angle) * r;
      positions[i3 + 2] = (Math.random() - 0.5) * tunnelLength;
      
      speeds[i] = 0.5 + Math.random() * 1;
    }
    
    return { positions, speeds };
  }, [tunnelLength, radius]);

  const particleMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color('#00d4ff') },
        time: { value: 0 },
        progress: { value: 0 },
      },
      vertexShader: `
        attribute float speed;
        varying float vAlpha;
        uniform float time;
        uniform float progress;
        
        void main() {
          vec3 pos = position;
          // 粒子沿Z轴流动
          pos.z = mod(pos.z + time * speed * 5.0 + tunnelLength / 2.0, tunnelLength) - tunnelLength / 2.0;
          
          // 根据进度调整透明度
          float distFromProgress = abs(pos.z / (tunnelLength / 2.0) - progress);
          vAlpha = 1.0 - smoothstep(0.0, 0.3, distFromProgress);
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = (4.0 * speed) * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float vAlpha;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = (1.0 - dist * 2.0) * vAlpha;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  const particleGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(particleData.positions, 3));
    geo.setAttribute('speed', new THREE.BufferAttribute(particleData.speeds, 1));
    return geo;
  }, [particleData]);

  useFrame((state) => {
    if (tunnelRef.current) {
      tunnelMaterial.uniforms.progress.value = progress;
      tunnelMaterial.uniforms.opacity.value = 0.3;
    }
    
    if (particlesRef.current) {
      particleMaterial.uniforms.time.value = state.clock.elapsedTime;
      particleMaterial.uniforms.progress.value = progress;
    }
  });

  return (
    <group ref={tunnelRef}>
      {/* 隧道内壁 */}
      <mesh geometry={tunnelGeometry} material={tunnelMaterial} />
      
      {/* 年份标记 */}
      {yearMarkers.map((marker) => (
        <group key={marker.year} position={marker.position}>
          {/* 发光背景 */}
          <mesh>
            <planeGeometry args={[2, 0.8]} />
            <meshBasicMaterial
              color="#00d4ff"
              transparent
              opacity={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* 年份文字 */}
          {/* 注意：实际文字使用 drei/Text 组件在父组件中渲染 */}
        </group>
      ))}
      
      {/* 粒子流 */}
      <points
        ref={particlesRef}
        geometry={particleGeometry}
        material={particleMaterial}
      />
    </group>
  );
}
