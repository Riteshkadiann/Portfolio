import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ConnectionData } from './types';

interface ConnectionsProps {
  connections: ConnectionData[];
  entryProgress: number;
}

export function Connections({ connections, entryProgress }: ConnectionsProps) {
  const linesRef = useRef<THREE.Group>(null);

  const lineMeshes = useMemo(() => {
    return connections.map((conn, index) => {
      const points = [new THREE.Vector3(...conn.from), new THREE.Vector3(...conn.to)];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      
      const material = new THREE.ShaderMaterial({
        uniforms: {
          color1: { value: new THREE.Color(conn.color) },
          color2: { value: new THREE.Color('#ffffff') },
          opacity: { value: 0.6 * entryProgress },
          time: { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color1;
          uniform vec3 color2;
          uniform float opacity;
          uniform float time;
          varying vec2 vUv;
          
          void main() {
            float flow = sin(vUv.x * 10.0 - time * 3.0) * 0.5 + 0.5;
            vec3 color = mix(color1, color2, flow * 0.3);
            float alpha = opacity * (0.5 + flow * 0.5);
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
      });

      return { geometry, material, id: index };
    });
  }, [connections, entryProgress]);

  useFrame((state) => {
    lineMeshes.forEach(({ material }) => {
      material.uniforms.time.value = state.clock.elapsedTime;
      material.uniforms.opacity.value = 0.6 * entryProgress;
    });
  });

  return (
    <group ref={linesRef}>
      {lineMeshes.map(({ geometry, material, id }) => (
        <primitive key={id} object={new THREE.Line(geometry, material)} />
      ))}
    </group>
  );
}
