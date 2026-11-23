import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { sync } from './account/sync';
import App from './App';
import './app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// With a grown-up's account, progress is sent and fetched when the app opens and each time it goes to the background.
const quietSync = () => void sync().catch(() => undefined);
quietSync();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') quietSync();
});
