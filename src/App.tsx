import { useEffect } from 'react';
import { Desktop } from './components/Desktop/Desktop';
import { ErrorBoundary } from './components/Shared/ErrorBoundary';
import { DesktopOnlyGate } from './components/Shared/DesktopOnlyGate';
import { useSimulationEngine } from './lib/useSimulationEngine';
import { useSimStore } from './store/simStore';
import { useUiStore } from './store/uiStore';

/** The full desktop experience — only mounted by DesktopOnlyGate when the
    viewport is desktop-sized, so the simulation engine never runs on mobile. */
function DesktopExperience() {
  useSimulationEngine();
  return (
    <ErrorBoundary label="CyberLab">
      <Desktop />
    </ErrorBoundary>
  );
}

function App() {
  const theme = useSimStore((s) => s.theme);
  const fontSize = useUiStore((s) => s.fontSize);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  return (
    <DesktopOnlyGate>
      <DesktopExperience />
    </DesktopOnlyGate>
  );
}

export default App;
