import { useState } from 'react';
import BiasDetective from './components/BiasDetective';
import ApiKeySetup from './components/ApiKeySetup';
import Guide from './components/Guide';

type Screen = 'app' | 'apiKey' | 'guide';

export default function App() {
  const [screen, setScreen] = useState<Screen>('app');

  if (screen === 'apiKey') {
    return <ApiKeySetup onClose={() => setScreen('app')} onOpenGuide={() => setScreen('guide')} />;
  }
  if (screen === 'guide') {
    return <Guide onClose={() => setScreen('app')} />;
  }
  return (
    <BiasDetective
      onOpenApiKeySetup={() => setScreen('apiKey')}
      onOpenGuide={() => setScreen('guide')}
    />
  );
}
