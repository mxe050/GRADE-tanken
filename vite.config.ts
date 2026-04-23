import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages (https://mxe050.github.io/GRADE-tanken/) 用に base を設定。
// ローカル開発時 (dev) は './' が解決されるのでそのまま動きます。
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/GRADE-tanken/' : './',
}));
