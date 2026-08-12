import { useEffect } from 'react';
import { Desktop } from './components/Desktop/Desktop';
import { ErrorBoundary } from './components/Shared/ErrorBoundary';
import { useSimulationEngine } from './lib/useSimulationEngine';
import { useSimStore } from './store/simStore';
import { useUiStore } from './store/uiStore';

function App() {
  useSimulationEngine();
  const theme = useSimStore((s) => s.theme);
  const fontSize = useUiStore((s) => s.fontSize);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  return (
    <ErrorBoundary label="CyberLab">
      <Desktop />
    </ErrorBoundary>
  );
}

export default App;
