import * as React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const container = document.getElementById('root')!;
const fallback = document.getElementById('seo-fallback');
if (fallback) fallback.remove();

createRoot(container).render(<App />);

requestAnimationFrame(() => {
  const splash = document.getElementById('boot-splash');
  if (!splash) return;
  splash.style.transition = 'opacity .2s ease';
  splash.style.opacity = '0';
  setTimeout(() => splash.remove(), 220);
});

export default App;
