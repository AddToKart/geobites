import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import './styles/globals.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider
    attribute="class"
    defaultTheme="light"
    enableSystem={false}
    disableTransitionOnChange
    storageKey="geobites-theme"
  >
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ThemeProvider>,
);
