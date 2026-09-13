import {useCallback, useRef, useState} from 'react';
import type {ExperienceMode} from './data';
import {Header} from './components/Header';
import {Hero} from './components/Hero';
import {ModeSwitcher} from './components/ModeSwitcher';
import {CheckpointCycle} from './components/CheckpointCycle';
import {BenchmarkExplorer} from './components/BenchmarkExplorer';
import {TuningLab} from './components/TuningLab';
import {AccuracySection} from './components/AccuracySection';
import {FooterCta} from './components/FooterCta';

export const App = () => {
  const [mode, setMode] = useState<ExperienceMode>('cycle');
  const [autoStartToken, setAutoStartToken] = useState(0);
  const labRef = useRef<HTMLElement>(null);

  const chooseMode = useCallback((nextMode: ExperienceMode, autoStart = false) => {
    setMode(nextMode);
    if (autoStart && nextMode === 'cycle') setAutoStartToken((token) => token + 1);
    window.requestAnimationFrame(() => labRef.current?.scrollIntoView({behavior: 'smooth', block: 'start'}));
  }, []);

  return (
    <>
      <Header mode={mode} onModeChange={(nextMode) => chooseMode(nextMode)} />
      <main>
        <Hero onStart={(nextMode) => chooseMode(nextMode, nextMode === 'cycle')} />
        <section className="lab-section page-shell" id="lab" ref={labRef}>
          <div className="section-rail"><span>THE CHECKPOINT PATH</span><i /></div>
          <ModeSwitcher mode={mode} onChange={setMode} />
          {mode === 'cycle' && <CheckpointCycle autoStartToken={autoStartToken} />}
          {mode === 'compare' && <BenchmarkExplorer />}
          {mode === 'tune' && <TuningLab />}
        </section>
        <AccuracySection />
      </main>
      <FooterCta />
    </>
  );
};
