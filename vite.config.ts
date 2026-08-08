import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function pagesBase(explicitBase: string | undefined, repository: string | undefined): string {
  const path = explicitBase?.trim() || repository?.split('/').at(-1) || '';
  if (!path || path === '/') return '/';
  return `/${path.replace(/^\/+|\/+$/g, '')}/`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    base: pagesBase(env.VITE_BASE_PATH, env.GITHUB_REPOSITORY),
  };
});
