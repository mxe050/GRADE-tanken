import { useState } from 'react';
import BiasDetective from './components/BiasDetective';
import ApiKeySetup from './components/ApiKeySetup';

export default function App() {
  const [showApiKey, setShowApiKey] = useState(false);

  if (showApiKey) {
    return <ApiKeySetup onClose={() => setShowApiKey(false)} />;
  }
  return <BiasDetective onOpenApiKeySetup={() => setShowApiKey(true)} />;
}
