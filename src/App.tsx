import {lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties} from 'react';
import {TopBar} from './components/TopBar';
import {NarrativeCard} from './components/NarrativeCard';
import {Minimap} from './components/Minimap';
import {ScenarioRail} from './components/ScenarioRail';
import {InspectorPanel} from './components/InspectorPanel';
import type {RenderQuality} from './components/WorldCanvas';
import {
  BENCHMARK,
  getCycleStage,
  getScenario,
  type ScenarioId,
  type SystemNodeId,
} from './data';
import {benchmarkRatio, getModelSnapshot, type TuningInputs} from './simulation';

const DURATION_BY_SCENARIO: Record<ScenarioId, number> = {
  overview: 34,
  cycle: 28,
  fpi: 24,
  evidence: 20,
  tune: 20,
  recovery: 22,
};

const ASSET_BASE = import.meta.env.BASE_URL;
const WorldCanvas = lazy(() => import('./components/WorldCanvas').then((module) => ({default: module.WorldCanvas})));

let audioContext: AudioContext | null = null;
const playTone = (frequency: number, duration = 0.075, volume = 0.022) => {
  if (typeof window === 'undefined') return;
  audioContext ??= new AudioContext();
  if (audioContext.state === 'suspended') void audioContext.resume();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.14, audioContext.currentTime + duration);
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(volume, audioContext.currentTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(); oscillator.stop(audioContext.currentTime + duration + 0.01);
};

export const App = () => {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('overview');
  const [selectedNode, setSelectedNode] = useState<SystemNodeId>('buffers');
  const [progress, setProgress] = useState(0.035);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [quality, setQuality] = useState<RenderQuality>(() => typeof window !== 'undefined' && window.innerWidth < 760 ? 'low' : 'medium');
  const [soundOn, setSoundOn] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 900);
  const [cameraResetToken, setCameraResetToken] = useState(0);
  const [selectedGap, setSelectedGap] = useState(3600);
  const [tuning, setTuning] = useState<TuningInputs>({timeoutMinutes: 30, maxWalGiB: 8, completionTarget: 0.9, illustrativeWalGiB: 6});
  const lastFrame = useRef<number | null>(null);

  const scenario = useMemo(() => getScenario(scenarioId), [scenarioId]);
  const snapshot = useMemo(
    () => getModelSnapshot(scenarioId, progress, tuning, benchmarkRatio(selectedGap)),
    [progress, scenarioId, selectedGap, tuning],
  );

  useEffect(() => {
    if (!playing) {lastFrame.current = null; return;}
    let animationFrame = 0;
    const tick = (time: number) => {
      if (lastFrame.current === null) lastFrame.current = time;
      const delta = Math.min(64, time - lastFrame.current);
      lastFrame.current = time;
      setProgress((current) => {
        const next = current + (delta / 1000 / DURATION_BY_SCENARIO[scenarioId]) * speed;
        if (next < 1) return next;
        if (scenarioId === 'overview' || scenarioId === 'fpi') return 0;
        window.requestAnimationFrame(() => setPlaying(false));
        return 1;
      });
      animationFrame = window.requestAnimationFrame(tick);
    };
    animationFrame = window.requestAnimationFrame(tick);
    return () => {window.cancelAnimationFrame(animationFrame); lastFrame.current = null;};
  }, [playing, scenarioId, speed]);

  useEffect(() => {
    if (!playing) return;
    let next: SystemNodeId | null = null;
    if (scenarioId === 'cycle') next = getCycleStage(progress).focus;
    if (scenarioId === 'fpi' || scenarioId === 'evidence') next = 'wal';
    if (scenarioId === 'tune') next = 'checkpointer';
    if (scenarioId === 'recovery') next = progress < 0.3 ? 'pgcontrol' : progress < 0.76 ? 'wal' : 'standby';
    if (next && next !== selectedNode) setSelectedNode(next);
  }, [playing, progress, scenarioId, selectedNode]);

  const chooseScenario = useCallback((next: ScenarioId) => {
    const config = getScenario(next);
    setScenarioId(next);
    setSelectedNode(config.focus);
    setProgress(next === 'overview' ? 0.035 : 0);
    setPlaying(config.autoPlay);
    setCameraResetToken((token) => token + 1);
    if (soundOn) playTone(330 + Number(config.index) * 45, 0.11, 0.026);
  }, [soundOn]);

  const chooseNode = useCallback((node: SystemNodeId) => {
    setSelectedNode(node);
    setCameraResetToken((token) => token + 1);
    if (soundOn) playTone(460, 0.06, 0.017);
  }, [soundOn]);

  const resetScenario = useCallback(() => {
    setProgress(0);
    setPlaying(scenario.autoPlay);
    setSelectedNode(scenario.focus);
    setCameraResetToken((token) => token + 1);
    if (soundOn) playTone(260, 0.09, 0.02);
  }, [scenario, soundOn]);

  const toggleSound = useCallback(() => {
    setSoundOn((current) => {
      if (!current) playTone(520, 0.09, 0.025);
      return !current;
    });
  }, []);

  return (
    <div
      className="sim-app"
      style={{'--mountain-image': `url("${ASSET_BASE}assets/percona-mountains.webp")`} as CSSProperties}
    >
      <div className="mountain-backdrop" aria-hidden="true" />
      <div className="atmosphere" aria-hidden="true"><i /><i /><i /></div>
      <TopBar scenario={scenario} snapshot={snapshot} progress={progress} quality={quality} soundOn={soundOn} onToggleSound={toggleSound} onResetView={() => setCameraResetToken((token) => token + 1)} onQualityChange={setQuality} />

      <main className={`world-stage ${inspectorOpen ? 'inspector-visible' : ''}`}>
        <Suspense fallback={<div className="world-loader"><i /><strong>Building Checkpoint Ridge</strong><span>Loading the interactive 3D system map…</span></div>}>
          <WorldCanvas scenario={scenarioId} selectedNode={selectedNode} snapshot={snapshot} progress={progress} quality={quality} cameraResetToken={cameraResetToken} onSelectNode={chooseNode} />
        </Suspense>
        <NarrativeCard scenario={scenario} progress={progress} snapshot={snapshot} />
        <Minimap selectedNode={selectedNode} onSelectNode={chooseNode} />
        <div className="model-key" aria-label="Visual data key">
          <span><i className="concept-dot" />Conceptual motion</span>
          <span><i className="measured-dot" />Measured in inspector</span>
          <span><i className="model-dot" />Directional controls</span>
        </div>
      </main>

      <InspectorPanel
        open={inspectorOpen}
        scenario={scenario}
        selectedNode={selectedNode}
        selectedGap={selectedGap}
        tuning={tuning}
        snapshot={snapshot}
        progress={progress}
        onClose={() => setInspectorOpen(false)}
        onOpen={() => setInspectorOpen(true)}
        onGapChange={(gap) => {setSelectedGap(gap); if (soundOn) playTone(390 + BENCHMARK.findIndex((point) => point.gapSeconds === gap) * 45);}}
        onTuningChange={setTuning}
      />

      <ScenarioRail scenario={scenarioId} progress={progress} playing={playing} speed={speed} onScenarioChange={chooseScenario} onProgressChange={(value) => {setProgress(value); setPlaying(false);}} onTogglePlay={() => setPlaying((current) => !current)} onReset={resetScenario} onSpeedChange={setSpeed} />
      <noscript>This interactive requires JavaScript. Read the full checkpoint analysis at percona.com.</noscript>
    </div>
  );
};
