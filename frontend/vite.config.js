import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the FinTech frontend. The React plugin enables the
// modern JSX transform; CSS Modules work out of the box for *.module.css files.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
});
