import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import TajweedPage from './tajweed';
import './app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TajweedPage />
  </StrictMode>
);
