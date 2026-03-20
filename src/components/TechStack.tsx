import * as THREE from "three";
import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { EffectComposer, N8AO } from "@react-three/postprocessing";
import {
  BallCollider,
  Physics,
  RigidBody,
  CylinderCollider,
  RapierRigidBody,
} from "@react-three/rapier";

const textureLoader = new THREE.TextureLoader();
const imageUrls = [
  "/images/react2.webp",
  "/images/node2.webp",
  "/images/express.webp",
  "/images/mongo.webp",
  "/images/mysql.webp",
  "/images/javascript.webp",
  "/images/pytorch.webp",
  "/images/tensorflow.webp",
  "/images/spacy.webp",
  "/images/numpy.webp",
  "/images/aws.webp",
  "/images/react.webp",
  "/images/node.webp",
  "/images/python.webp",
  "/images/java.webp",
  "/images/pandas.webp",
];
const textures = imageUrls.map((url) => textureLoader.load(url));

const sphereGeometry = new THREE.SphereGeometry(1, 28, 28);

const spheres = [...Array(30)].map(() => ({
  scale: [0.7, 1, 0.8, 1, 1][Math.floor(Math.random() * 5)],
}));

type SphereProps = {
  vec?: THREE.Vector3;
  scale: number;
  r?: typeof THREE.MathUtils.randFloatSpread;
  material: THREE.MeshPhysicalMaterial;
  isActive: boolean;
};

function SphereGeo({
  vec = new THREE.Vector3(),
  scale,
  r = THREE.MathUtils.randFloatSpread,
  material,
  isActive,
}: SphereProps) {
  const api = useRef<RapierRigidBody | null>(null);

  useFrame((_state, delta) => {
    if (!isActive) return;
    delta = Math.min(0.1, delta);
    const impulse = vec
      .copy(api.current!.translation())
      .normalize()
      .multiply(
        new THREE.Vector3(
          -50 * delta * scale,
          -150 * delta * scale,
          -50 * delta * scale
        )
      );

    api.current?.applyImpulse(impulse, true);
  });

  return (
    <RigidBody
      linearDamping={0.75}
      angularDamping={0.15}
      friction={0.2}
      position={[r(20), r(20) - 25, r(20) - 10]}
      ref={api}
      colliders={false}
    >
      <BallCollider args={[scale]} />
      <CylinderCollider
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 1.2 * scale]}
        args={[0.15 * scale, 0.275 * scale]}
      />
      <mesh
        castShadow
        receiveShadow
        scale={scale}
        geometry={sphereGeometry}
        material={material}
        rotation={[0.3, 1, 1]}
      />
    </RigidBody>
  );
}

type PointerProps = {
  vec?: THREE.Vector3;
  isActive: boolean;
};

function Pointer({ vec = new THREE.Vector3(), isActive }: PointerProps) {
  const ref = useRef<RapierRigidBody>(null);

  useFrame(({ pointer, viewport }) => {
    if (!isActive) return;
    const targetVec = vec.lerp(
      new THREE.Vector3(
        (pointer.x * viewport.width) / 2,
        (pointer.y * viewport.height) / 2,
        0
      ),
      0.2
    );
    ref.current?.setNextKinematicTranslation(targetVec);
  });

  return (
    <RigidBody
      position={[100, 100, 100]}
      type="kinematicPosition"
      colliders={false}
      ref={ref}
    >
      <BallCollider args={[2]} />
    </RigidBody>
  );
}

const TechStack = () => {
  const [isActive, setIsActive] = useState(false);
  const [webglAvailable, setWebglAvailable] = useState(true);

  useEffect(() => {
    // Check WebGL availability
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("webgl2");
    if (!gl) {
      setWebglAvailable(false);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const threshold = document
        .getElementById("work")!
        .getBoundingClientRect().top;
      setIsActive(scrollY > threshold);
    };
    document.querySelectorAll(".header a").forEach((elem) => {
      const element = elem as HTMLAnchorElement;
      element.addEventListener("click", () => {
        const interval = setInterval(() => {
          handleScroll();
        }, 10);
        setTimeout(() => {
          clearInterval(interval);
        }, 1000);
      });
    });
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  const materials = useMemo(() => {
    return textures.map(
      (texture) =>
        new THREE.MeshPhysicalMaterial({
          map: texture,
          emissive: "#ffffff",
          emissiveMap: texture,
          emissiveIntensity: 0.3,
          metalness: 0.5,
          roughness: 1,
          clearcoat: 0.1,
        })
    );
  }, []);

  return (
    <div className="techstack">
      <div className="techstack-container">
        {/* LEFT SIDE - TEXT CONTENT */}
        <div className="techstack-content">
          <div className="techstack-header">
            <h2 className="techstack-title">Tech Stack</h2>
            <p className="techstack-subtitle">Building scalable systems and AI solutions</p>
          </div>

          {/* Core Stack Section */}
          <div className="techstack-section">
            <h3 className="section-core-title">Core Stack</h3>
            <div className="core-skills">
              {["Python", "FastAPI", "AWS", "JavaScript"].map((skill) => (
                <span key={skill} className={`core-skill core-skill-${skill.toLowerCase().replace(/[.\s]/g, '')}`}>
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Backend Systems */}
          <div className="techstack-section">
            <h3 className="section-title">Backend Systems</h3>
            <p className="section-description">High-performance APIs · Scalable architectures · Distributed systems</p>
          </div>

          {/* AI / Machine Learning */}
          <div className="techstack-section">
            <h3 className="section-title">AI / Machine Learning</h3>
            <p className="section-description">PyTorch · scikit-learn · NLP · Data processing</p>
          </div>

          {/* Infrastructure */}
          <div className="techstack-section">
            <h3 className="section-title">Infrastructure</h3>
            <p className="section-description">AWS (EC2, S3) · REST APIs · Git</p>
          </div>
        </div>

        {/* RIGHT SIDE - ANIMATED BALLS */}
        <div className="techstack-canvas-wrapper">
          {webglAvailable ? (
            <Canvas
              shadows
              gl={{ alpha: true, stencil: false, depth: false, antialias: false }}
              camera={{ position: [0, 0, 20], fov: 32.5, near: 1, far: 100 }}
              onCreated={(state) => (state.gl.toneMappingExposure = 1.5)}
              className="tech-canvas"
            >
              <ambientLight intensity={1} />
              <spotLight
                position={[20, 20, 25]}
                penumbra={1}
                angle={0.2}
                color="white"
                castShadow
                shadow-mapSize={[512, 512]}
              />
              <directionalLight position={[0, 5, -4]} intensity={2} />
              <Physics gravity={[0, 0, 0]}>
                <Pointer isActive={isActive} />
                {spheres.map((props, i) => (
                  <SphereGeo
                    key={i}
                    {...props}
                    material={materials[Math.floor(Math.random() * materials.length)]}
                    isActive={isActive}
                  />
                ))}
              </Physics>
              <Environment
                files="/models/char_enviorment.hdr"
                environmentIntensity={0.5}
                environmentRotation={[0, 4, 2]}
              />
              <EffectComposer enableNormalPass={false}>
                <N8AO color="#0f002c" aoRadius={2} intensity={1.15} />
              </EffectComposer>
            </Canvas>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#aaa",
                padding: "20px",
                textAlign: "center",
                borderRadius: "8px",
              }}
            >
              <div>
                <p style={{ fontSize: "14px" }}>
                  WebGL is not available
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechStack;
