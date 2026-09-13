import {useEffect, useMemo, useRef, type CSSProperties, type ReactNode} from 'react';
import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {
  ContactShadows,
  Float,
  Grid,
  Html,
  Line,
  OrbitControls,
  PerspectiveCamera,
  RoundedBox,
  Sparkles,
  useTexture,
} from '@react-three/drei';
import {Bloom, EffectComposer, Vignette} from '@react-three/postprocessing';
import * as THREE from 'three';
import type {OrbitControls as OrbitControlsImpl} from 'three-stdlib';
import {SYSTEM_NODES, getSystemNode, type ScenarioId, type SystemNodeId} from '../data';
import {getFpiSignal, type ModelSnapshot} from '../simulation';

export type RenderQuality = 'low' | 'medium' | 'high';

type WorldCanvasProps = {
  scenario: ScenarioId;
  selectedNode: SystemNodeId;
  snapshot: ModelSnapshot;
  progress: number;
  quality: RenderQuality;
  cameraResetToken: number;
  onSelectNode: (node: SystemNodeId) => void;
};

type NodeShellProps = {
  id: SystemNodeId;
  selected: boolean;
  onSelect: (id: SystemNodeId) => void;
  children: ReactNode;
  labelOffset?: readonly [number, number, number];
};

const ASSET_BASE = import.meta.env.BASE_URL;
const UP = new THREE.Vector3(0, 1, 0);

const NodeShell = ({id, selected, onSelect, children, labelOffset = [0, 3.4, 0]}: NodeShellProps) => {
  const node = getSystemNode(id);
  return (
    <group
      position={node.world}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(id);
      }}
    >
      <DistrictPlate color={node.color} selected={selected} />
      {children}
      <Html position={labelOffset} center distanceFactor={18} zIndexRange={[20, 0]}>
        <button
          className={`world-label ${selected ? 'active' : ''}`}
          style={{'--node-color': node.color} as CSSProperties}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(id);
          }}
        >
          <span>{node.short}</span>
          <strong>{node.label}</strong>
        </button>
      </Html>
    </group>
  );
};

const DistrictPlate = ({color, selected}: {color: string; selected: boolean}) => (
  <group position={[0, 0.04, 0]}>
    <RoundedBox args={[5.7, 0.18, 4.6]} radius={0.28} smoothness={4} receiveShadow>
      <meshStandardMaterial
        color="#101d32"
        emissive={color}
        emissiveIntensity={selected ? 0.12 : 0.028}
        metalness={0.5}
        roughness={0.42}
        transparent
        opacity={0.93}
      />
    </RoundedBox>
    <Line
      points={[
        [-2.5, 0.12, -1.95], [2.5, 0.12, -1.95], [2.82, 0.12, -1.62],
        [2.82, 0.12, 1.62], [2.5, 0.12, 1.95], [-2.5, 0.12, 1.95],
        [-2.82, 0.12, 1.62], [-2.82, 0.12, -1.62], [-2.5, 0.12, -1.95],
      ]}
      color={color}
      lineWidth={selected ? 2.1 : 0.8}
      transparent
      opacity={selected ? 0.92 : 0.26}
    />
    {selected && (
      <>
        <mesh position={[0, 0.17, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.42, 2.62, 64]} />
          <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 1.9, 0]}>
          <cylinderGeometry args={[0.018, 0.075, 3.5, 12]} />
          <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.14} depthWrite={false} />
        </mesh>
      </>
    )}
  </group>
);

const ClientDistrict = ({selected, onSelect}: Pick<NodeShellProps, 'selected' | 'onSelect'>) => (
  <NodeShell id="clients" selected={selected} onSelect={onSelect} labelOffset={[0, 3.3, 0]}>
    <group position={[0, 0.2, 0]}>
      {Array.from({length: 9}, (_, index) => {
        const x = (index % 3 - 1) * 1.25;
        const z = (Math.floor(index / 3) - 1) * 1.08;
        const height = 0.95 + ((index * 7) % 4) * 0.28;
        return (
          <group key={index} position={[x, 0, z]}>
            <RoundedBox args={[0.78, height, 0.68]} radius={0.12} smoothness={3} position={[0, height / 2, 0]} castShadow>
              <meshStandardMaterial color="#1b3552" metalness={0.58} roughness={0.28} emissive="#43d9ff" emissiveIntensity={0.055} />
            </RoundedBox>
            {[0.38, 0.68].map((y) => (
              <mesh key={y} position={[0, Math.min(height - 0.18, y), 0.352]}>
                <planeGeometry args={[0.42, 0.07]} />
                <meshBasicMaterial color="#43d9ff" toneMapped={false} transparent opacity={0.72} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  </NodeShell>
);

const BufferDistrict = ({selected, onSelect, dirtyPages}: Pick<NodeShellProps, 'selected' | 'onSelect'> & {dirtyPages: number}) => {
  const litCount = Math.round((dirtyPages / 100) * 24);
  return (
    <NodeShell id="buffers" selected={selected} onSelect={onSelect} labelOffset={[0, 3.05, 0]}>
      <group position={[0, 0.28, 0]}>
        {Array.from({length: 24}, (_, index) => {
          const x = (index % 6 - 2.5) * 0.76;
          const z = (Math.floor(index / 6) - 1.5) * 0.72;
          const dirty = index < litCount;
          return (
            <Float key={index} speed={dirty ? 1.2 : 0.45} rotationIntensity={0} floatIntensity={dirty ? 0.08 : 0.025}>
              <RoundedBox args={[0.56, 0.28, 0.48]} radius={0.07} smoothness={2} position={[x, dirty ? 0.34 : 0.24, z]} castShadow>
                <meshStandardMaterial
                  color={dirty ? '#472d74' : '#25324b'}
                  emissive={dirty ? '#9d71ff' : '#475776'}
                  emissiveIntensity={dirty ? 0.52 : 0.08}
                  metalness={0.45}
                  roughness={0.32}
                />
              </RoundedBox>
            </Float>
          );
        })}
        <Line points={[[-2.2, 0.1, 1.68], [2.2, 0.1, 1.68]]} color="#7c63ff" lineWidth={2} transparent opacity={0.66} />
      </group>
    </NodeShell>
  );
};

const WalDistrict = ({selected, onSelect, intensity}: Pick<NodeShellProps, 'selected' | 'onSelect'> & {intensity: number}) => (
  <NodeShell id="wal" selected={selected} onSelect={onSelect} labelOffset={[0, 3.5, 0]}>
    <group position={[0, 0.26, 0]} rotation={[0, -0.18, 0]}>
      {Array.from({length: 13}, (_, index) => {
        const height = 0.65 + intensity * (0.35 + ((index * 11) % 7) * 0.12);
        return (
          <group key={index} position={[-2.12 + index * 0.35, 0, Math.sin(index * 1.7) * 0.12]}>
            <RoundedBox args={[0.24, height, 1.55]} radius={0.06} smoothness={2} position={[0, height / 2, 0]} castShadow>
              <meshStandardMaterial color="#342719" emissive="#ff9b32" emissiveIntensity={0.2 + intensity * 0.56} metalness={0.72} roughness={0.24} />
            </RoundedBox>
            <mesh position={[0, height + 0.06, 0]}>
              <boxGeometry args={[0.3, 0.08, 1.68]} />
              <meshBasicMaterial color="#ffbd5b" toneMapped={false} transparent opacity={0.55 + intensity * 0.4} />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, 0.22, -1.26]}>
        <boxGeometry args={[4.8, 0.12, 0.22]} />
        <meshBasicMaterial color="#ff8a2a" toneMapped={false} transparent opacity={0.65} />
      </mesh>
    </group>
  </NodeShell>
);

const CheckpointerDistrict = ({selected, onSelect, intensity}: Pick<NodeShellProps, 'selected' | 'onSelect'> & {intensity: number}) => {
  const rings = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (rings.current) rings.current.rotation.y += delta * (0.22 + intensity * 1.25);
  });
  return (
    <NodeShell id="checkpointer" selected={selected} onSelect={onSelect} labelOffset={[0, 4.7, 0]}>
      <group position={[0, 0.2, 0]}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <cylinderGeometry args={[1.25, 1.48, 2.4, 12]} />
          <meshStandardMaterial color="#29313a" emissive="#f6fe54" emissiveIntensity={0.09 + intensity * 0.2} metalness={0.77} roughness={0.25} />
        </mesh>
        <mesh position={[0, 2.5, 0]} castShadow>
          <cylinderGeometry args={[0.78, 1.1, 0.34, 12]} />
          <meshStandardMaterial color="#dbe548" emissive="#f6fe54" emissiveIntensity={0.28 + intensity * 0.52} metalness={0.32} roughness={0.28} />
        </mesh>
        <group ref={rings} position={[0, 1.45, 0]}>
          {[0, Math.PI / 2].map((rotation) => (
            <mesh key={rotation} rotation={[Math.PI / 2, rotation, 0]}>
              <torusGeometry args={[1.62, 0.045, 10, 80]} />
              <meshBasicMaterial color="#f6fe54" toneMapped={false} transparent opacity={0.32 + intensity * 0.58} />
            </mesh>
          ))}
        </group>
        <pointLight color="#f6fe54" intensity={0.8 + intensity * 3.2} distance={8} position={[0, 2.8, 0]} />
      </group>
    </NodeShell>
  );
};

const StorageDistrict = ({selected, onSelect, intensity}: Pick<NodeShellProps, 'selected' | 'onSelect'> & {intensity: number}) => (
  <NodeShell id="storage" selected={selected} onSelect={onSelect} labelOffset={[0, 4.25, 0]}>
    <group position={[0, 0.22, 0]}>
      {[-1.25, 0, 1.25].map((x, index) => (
        <group key={x} position={[x, 0, index === 1 ? -0.32 : 0.18]}>
          <mesh position={[0, 1.22 + (index === 1 ? 0.25 : 0), 0]} castShadow>
            <cylinderGeometry args={[0.76, 0.76, 2.3 + (index === 1 ? 0.5 : 0), 24]} />
            <meshStandardMaterial color="#183b38" emissive="#56e3a2" emissiveIntensity={0.08 + intensity * 0.25} metalness={0.65} roughness={0.28} />
          </mesh>
          {[0.45, 1.05, 1.65].map((y) => (
            <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.79, 0.035, 8, 40]} />
              <meshBasicMaterial color="#70f1b7" toneMapped={false} transparent opacity={0.28 + intensity * 0.48} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 0.18, 1.35]}>
        <boxGeometry args={[4.6, 0.12, 0.18]} />
        <meshBasicMaterial color="#56e3a2" toneMapped={false} transparent opacity={0.64} />
      </mesh>
    </group>
  </NodeShell>
);

const PgControlDistrict = ({selected, onSelect, advanced}: Pick<NodeShellProps, 'selected' | 'onSelect'> & {advanced: boolean}) => {
  const core = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (core.current) core.current.rotation.y += delta * 0.42;
  });
  return (
    <NodeShell id="pgcontrol" selected={selected} onSelect={onSelect} labelOffset={[0, 4.6, 0]}>
      <group position={[0, 0.2, 0]}>
        {[2.25, 1.72, 1.18].map((size, index) => (
          <RoundedBox key={size} args={[size, 0.45, size]} radius={0.15} smoothness={3} position={[0, 0.22 + index * 0.43, 0]} castShadow>
            <meshStandardMaterial color={index === 2 ? '#4e2638' : '#273044'} emissive="#ff6685" emissiveIntensity={index === 2 ? 0.25 : 0.055} metalness={0.64} roughness={0.28} />
          </RoundedBox>
        ))}
        <mesh ref={core} position={[0, 2.05, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <octahedronGeometry args={[0.78, 0]} />
          <meshStandardMaterial color={advanced ? '#ff839a' : '#4b4053'} emissive="#ff6685" emissiveIntensity={advanced ? 1.25 : 0.16} metalness={0.48} roughness={0.18} />
        </mesh>
        <Line points={[[-1.8, 1.3, 0], [1.8, 1.3, 0]]} color="#ff6685" lineWidth={1.5} transparent opacity={advanced ? 0.95 : 0.25} />
      </group>
    </NodeShell>
  );
};

const StandbyDistrict = ({selected, onSelect, intensity}: Pick<NodeShellProps, 'selected' | 'onSelect'> & {intensity: number}) => {
  const dish = useRef<THREE.Group>(null);
  useFrame(({clock}) => {
    if (dish.current) dish.current.rotation.y = Math.sin(clock.elapsedTime * 0.34) * 0.4 - 0.25;
  });
  return (
    <NodeShell id="standby" selected={selected} onSelect={onSelect} labelOffset={[0, 4.25, 0]}>
      <group position={[0, 0.2, 0]}>
        <mesh position={[0, 1.05, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.9, 2.1, 12]} />
          <meshStandardMaterial color="#30284d" emissive="#b886ff" emissiveIntensity={0.12 + intensity * 0.28} metalness={0.66} roughness={0.26} />
        </mesh>
        <group ref={dish} position={[0, 2.3, 0]} rotation={[0, -0.25, -0.25]}>
          <mesh rotation={[0, 0, -0.65]}>
            <sphereGeometry args={[1.05, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#604891" emissive="#b886ff" emissiveIntensity={0.32} side={THREE.DoubleSide} metalness={0.7} roughness={0.2} />
          </mesh>
          <mesh position={[0.62, 0.6, 0]}>
            <sphereGeometry args={[0.14, 14, 14]} />
            <meshBasicMaterial color="#e3ccff" toneMapped={false} />
          </mesh>
        </group>
        <pointLight color="#b886ff" intensity={intensity * 5} distance={7} position={[0, 2.8, 0]} />
      </group>
    </NodeShell>
  );
};

type RailProps = {
  from: readonly [number, number, number];
  to: readonly [number, number, number];
  color: string;
  active: number;
  speed?: number;
  arch?: number;
};

const DataRail = ({from, to, color, active, speed = 0.15, arch = 1.2}: RailProps) => {
  const packets = useRef<THREE.Group>(null);
  const curve = useMemo(() => {
    const start = new THREE.Vector3(...from).addScaledVector(UP, 0.48);
    const end = new THREE.Vector3(...to).addScaledVector(UP, 0.48);
    const middle = start.clone().lerp(end, 0.5).addScaledVector(UP, arch);
    return new THREE.QuadraticBezierCurve3(start, middle, end);
  }, [arch, from, to]);
  const points = useMemo(() => curve.getPoints(50), [curve]);

  useFrame(({clock}) => {
    if (!packets.current || active < 0.08) return;
    packets.current.children.forEach((packet, index) => {
      const t = (clock.elapsedTime * (speed + active * 0.24) - index * 0.115 + 1) % 1;
      packet.position.copy(curve.getPoint(t));
      packet.scale.setScalar((0.66 + active * 0.46) * (1 - index * 0.15));
    });
  });

  return (
    <group>
      <Line points={points} color={color} lineWidth={0.7 + active * 2.2} transparent opacity={0.11 + active * 0.62} />
      <group ref={packets} visible={active > 0.08}>
        {[0, 1, 2].map((index) => (
          <mesh key={index}>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshBasicMaterial color={color} toneMapped={false} transparent opacity={1 - index * 0.24} />
            {index === 0 && <pointLight color={color} intensity={1 + active * 3} distance={2.4} />}
          </mesh>
        ))}
      </group>
    </group>
  );
};

const fpiHeightAt = (t: number, cycles: number) => 0.78 + getFpiSignal(t, cycles).fpi * 3.15;

const FpiWave = ({visible, progress, cycles}: {visible: boolean; progress: number; cycles: number}) => {
  const goat = useRef<THREE.Group>(null);
  const texture = useTexture(`${ASSET_BASE}assets/goats/goat-jump.png`);
  const points = useMemo(() => Array.from({length: 100}, (_, index) => {
    const t = index / 99;
    return new THREE.Vector3(-7 + t * 10.5, fpiHeightAt(t, cycles), -7.2);
  }), [cycles]);
  const checkpointMarkers = useMemo(
    () => Array.from({length: cycles}, (_, index) => index / cycles),
    [cycles],
  );

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  useFrame(() => {
    if (!goat.current) return;
    const t = Math.min(0.995, Math.max(0, progress));
    goat.current.position.set(-7 + t * 10.5, fpiHeightAt(t, cycles) + 0.9, -7.2);
    goat.current.rotation.z = THREE.MathUtils.lerp(goat.current.rotation.z, -0.07 + Math.sin(t * 19) * 0.035, 0.1);
  });

  if (!visible) return null;
  return (
    <group>
      <Line points={points} color="#ffad42" lineWidth={2.4} transparent opacity={0.88} />
      <Line points={points.map((point) => point.clone().add(new THREE.Vector3(0, -0.12, 0)))} color="#f6fe54" lineWidth={0.8} transparent opacity={0.52} />
      {checkpointMarkers.map((marker, index) => {
        const x = -7 + marker * 10.5;
        return (
          <group key={marker}>
            <Line points={[[x, 0.62, -7.2], [x, 4.45, -7.2]]} color="#ff6685" lineWidth={0.8} dashed dashSize={0.14} gapSize={0.1} transparent opacity={0.54} />
            <Html position={[x, 0.45, -7.2]} center distanceFactor={15}>
              <div className="checkpoint-marker">CP {index + 1}</div>
            </Html>
          </group>
        );
      })}
      <group ref={goat}>
        <sprite scale={[3.2, 2.15, 1]}>
          <spriteMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
        </sprite>
        <pointLight color="#ffad42" intensity={3} distance={4} position={[0, -0.2, 0]} />
      </group>
      <Html position={[-1.9, 4.8, -7.2]} center distanceFactor={14}>
        <div className="world-callout"><span>CONCEPTUAL</span> synchronized FPI signal · {cycles} checkpoint {cycles === 1 ? 'cycle' : 'cycles'}</div>
      </Html>
    </group>
  );
};

const ScenarioGuides = ({scenario, snapshot}: {scenario: ScenarioId; snapshot: ModelSnapshot}) => {
  if (scenario === 'evidence') {
    return (
      <Html position={[-4, 5.35, -3]} center distanceFactor={15}>
        <div className="world-data-card measured-card">
          <small>SELECTED RUN · VS 5 MIN</small>
          <span><b>{Math.round(snapshot.walIntensity * 100)}%</b> WAL</span>
          <span><b>{Math.round(snapshot.fpiIntensity * 100)}%</b> FPI</span>
        </div>
      </Html>
    );
  }
  if (scenario === 'tune') {
    return (
      <Html position={[0, 5.65, 0]} center distanceFactor={15}>
        <div className={`world-data-card tuning-card ${snapshot.phase.includes('WAL') ? 'risk' : ''}`}>
          <small>DIRECTIONAL MODEL</small>
          <strong>{snapshot.phase}</strong>
          <span>{snapshot.phaseDetail}</span>
        </div>
      </Html>
    );
  }
  if (scenario === 'recovery') {
    return (
      <>
        <Html position={[2.2, 4.75, -3.9]} center distanceFactor={16}>
          <div className="world-data-card recovery-card"><small>PRIMARY RESTART</small><strong>LOCAL WAL REPLAY</strong><span>redo point → data files</span></div>
        </Html>
        <Html position={[7.1, 4.65, -4]} center distanceFactor={16}>
          <div className="world-data-card ha-card"><small>SEPARATE HA PATH</small><strong>STANDBY FAILOVER</strong><span>promotion, not crash recovery</span></div>
        </Html>
      </>
    );
  }
  return null;
};

const AlpinePerimeter = ({quality}: {quality: RenderQuality}) => {
  const count = quality === 'low' ? 16 : quality === 'medium' ? 26 : 38;
  const peaks = useMemo(() => Array.from({length: count}, (_, index) => {
    const angle = (index / count) * Math.PI * 2;
    const radius = 16.5 + Math.sin(index * 2.81) * 2.4;
    return {
      position: [Math.cos(angle) * radius, -1.15, Math.sin(angle) * radius] as const,
      scale: [2.8 + (index % 4) * 0.55, 4.3 + ((index * 7) % 6) * 0.78, 2.8 + ((index * 3) % 4) * 0.48] as const,
      rotation: angle * 0.3,
    };
  }), [count]);
  return (
    <group>
      {peaks.map((peak, index) => (
        <group key={index} position={peak.position} rotation={[0, peak.rotation, 0]}>
          <mesh scale={peak.scale}>
            <coneGeometry args={[1, 1, 4]} />
            <meshStandardMaterial color={index % 3 === 0 ? '#21334c' : '#182840'} emissive="#52698a" emissiveIntensity={0.045} roughness={0.9} metalness={0.12} />
          </mesh>
          {index % 3 !== 1 && (
            <mesh position={[0, peak.scale[1] * 0.31, 0]} scale={[peak.scale[0] * 0.42, peak.scale[1] * 0.34, peak.scale[2] * 0.42]}>
              <coneGeometry args={[1, 1, 4]} />
              <meshStandardMaterial color="#b9c6d8" emissive="#b9c6d8" emissiveIntensity={0.045} roughness={0.82} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
};

const CameraRig = ({selectedNode, scenario, cameraResetToken}: {selectedNode: SystemNodeId; scenario: ScenarioId; cameraResetToken: number}) => {
  const {camera, size} = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const targetPosition = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3());
  const framesLeft = useRef(0);

  useEffect(() => {
    const node = getSystemNode(selectedNode);
    const focus = scenario === 'overview'
      ? size.width < 700 ? new THREE.Vector3(0, 0.5, 0) : new THREE.Vector3(-2, 0.5, 1)
      : new THREE.Vector3(node.world[0], 0.9, node.world[2]);
    const offset = scenario === 'overview'
      ? size.width < 700 ? new THREE.Vector3(34, 28, 38) : new THREE.Vector3(22, 18, 25)
      : scenario === 'recovery'
          ? new THREE.Vector3(10, 8.4, -10.8)
          : new THREE.Vector3(9.8, 8.2, 11.4);
    lookTarget.current.copy(focus);
    targetPosition.current.copy(focus).add(offset);
    framesLeft.current = 110;
  }, [cameraResetToken, scenario, selectedNode, size.width]);

  useFrame(() => {
    if (framesLeft.current <= 0) return;
    camera.position.lerp(targetPosition.current, 0.055);
    if (controls.current) {
      controls.current.target.lerp(lookTarget.current, 0.07);
      controls.current.update();
    }
    framesLeft.current -= 1;
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.065}
      minDistance={8}
      maxDistance={52}
      minPolarAngle={0.32}
      maxPolarAngle={Math.PI / 2.12}
      target={[0, 0.5, 0]}
    />
  );
};

const World = (props: WorldCanvasProps) => {
  const {snapshot, selectedNode, onSelectNode, scenario, progress, quality, cameraResetToken} = props;
  const nodePosition = (id: SystemNodeId) => getSystemNode(id).world;
  const showWave = scenario === 'fpi' || (scenario === 'cycle' && snapshot.goatVisible);
  const spikeProgress = scenario === 'cycle' ? Math.max(0, Math.min(1, (progress - 0.66) / 0.35)) : progress;
  const waveCycles = scenario === 'fpi' ? 2 : 1;
  return (
    <>
      <PerspectiveCamera makeDefault fov={34} position={[20, 18.5, 26]} near={0.1} far={110} />
      <CameraRig selectedNode={selectedNode} scenario={scenario} cameraResetToken={cameraResetToken} />
      <color attach="background" args={['#07111f']} />
      <fog attach="fog" args={['#07111f', 30, 61]} />
      <ambientLight intensity={1.05} color="#b7c6e3" />
      <hemisphereLight args={['#8aa8d0', '#111c2e', 1.15]} />
      <directionalLight position={[9, 18, 10]} intensity={2.9} color="#fff4dc" castShadow shadow-mapSize={quality === 'high' ? 2048 : 1024} />
      <pointLight position={[-12, 7, -8]} intensity={32} distance={30} color="#653df4" />
      <pointLight position={[12, 8, 9]} intensity={24} distance={25} color="#2aa6df" />

      <group position={[0, -0.42, 0]}>
        <RoundedBox args={[31, 0.68, 23]} radius={1.2} smoothness={6} receiveShadow>
          <meshStandardMaterial color="#16283f" metalness={0.36} roughness={0.69} />
        </RoundedBox>
        <Grid position={[0, 0.36, 0]} args={[30, 22]} cellSize={0.8} cellThickness={0.38} cellColor="#426083" sectionSize={4} sectionThickness={0.72} sectionColor="#653df4" fadeDistance={28} fadeStrength={1.5} infiniteGrid={false} />
      </group>
      <AlpinePerimeter quality={quality} />

      <DataRail from={nodePosition('clients')} to={nodePosition('buffers')} color="#43d9ff" active={0.46} arch={1.1} />
      <DataRail from={nodePosition('clients')} to={nodePosition('wal')} color="#ffad42" active={snapshot.walIntensity} arch={1.7} />
      <DataRail from={nodePosition('buffers')} to={nodePosition('checkpointer')} color="#f6fe54" active={snapshot.checkpointIntensity} arch={1.45} />
      <DataRail from={nodePosition('checkpointer')} to={nodePosition('storage')} color="#56e3a2" active={snapshot.storageIntensity} arch={1.4} />
      <DataRail from={nodePosition('checkpointer')} to={nodePosition('pgcontrol')} color="#ff6685" active={snapshot.redoAdvanced ? 0.72 : 0.12} arch={1.15} />
      <DataRail from={nodePosition('wal')} to={nodePosition('standby')} color="#b886ff" active={snapshot.standbyIntensity} arch={2.45} speed={0.12} />
      {scenario === 'recovery' && (
        <>
          <DataRail from={nodePosition('pgcontrol')} to={nodePosition('wal')} color="#ff6685" active={progress < 0.3 ? 0.92 : 0.24} arch={1.35} speed={0.11} />
          <DataRail from={nodePosition('wal')} to={nodePosition('storage')} color="#56e3a2" active={snapshot.replayIntensity} arch={3.15} speed={0.16} />
        </>
      )}

      <ClientDistrict selected={selectedNode === 'clients'} onSelect={onSelectNode} />
      <BufferDistrict selected={selectedNode === 'buffers'} onSelect={onSelectNode} dirtyPages={snapshot.dirtyPages} />
      <WalDistrict selected={selectedNode === 'wal'} onSelect={onSelectNode} intensity={snapshot.walIntensity} />
      <CheckpointerDistrict selected={selectedNode === 'checkpointer'} onSelect={onSelectNode} intensity={snapshot.checkpointIntensity} />
      <StorageDistrict selected={selectedNode === 'storage'} onSelect={onSelectNode} intensity={snapshot.storageIntensity} />
      <PgControlDistrict selected={selectedNode === 'pgcontrol'} onSelect={onSelectNode} advanced={snapshot.redoAdvanced} />
      <StandbyDistrict selected={selectedNode === 'standby'} onSelect={onSelectNode} intensity={snapshot.standbyIntensity} />
      <FpiWave visible={showWave} progress={spikeProgress} cycles={waveCycles} />
      <ScenarioGuides scenario={scenario} snapshot={snapshot} />

      {quality !== 'low' && <Sparkles count={quality === 'high' ? 120 : 70} scale={[31, 10, 23]} size={1.2} speed={0.16} opacity={0.16} color="#b9c6ff" />}
      {quality !== 'low' && <ContactShadows position={[0, -0.04, 0]} opacity={0.45} scale={32} blur={2.6} far={12} resolution={quality === 'high' ? 1024 : 512} color="#02050d" />}
      {quality !== 'low' && (
        <EffectComposer multisampling={quality === 'high' ? 4 : 0}>
          <Bloom intensity={0.55} luminanceThreshold={0.62} luminanceSmoothing={0.25} mipmapBlur />
          <Vignette eskil={false} offset={0.15} darkness={0.62} />
        </EffectComposer>
      )}
    </>
  );
};

export const WorldCanvas = (props: WorldCanvasProps) => (
  <div className="world-canvas" aria-label="Interactive three-dimensional PostgreSQL checkpoint system map">
    <Canvas
      shadows={props.quality !== 'low'}
      dpr={props.quality === 'high' ? [1, 1.75] : props.quality === 'medium' ? [1, 1.35] : 1}
      gl={{antialias: props.quality !== 'low', alpha: false, powerPreference: 'high-performance'}}
      onPointerMissed={() => undefined}
    >
      <World {...props} />
    </Canvas>
    <div className="canvas-fallback">Your browser needs WebGL to explore Checkpoint Ridge.</div>
  </div>
);

export const WORLD_NODE_COUNT = SYSTEM_NODES.length;
