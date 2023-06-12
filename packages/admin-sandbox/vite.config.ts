import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolveConfig } from '../../build'

export default defineConfig({
	root: 'admin',
	plugins: [react()],
	resolve: resolveConfig,
})
