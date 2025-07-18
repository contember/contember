import contember from '@contember/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(() => {
	return {
		plugins: [tsconfigPaths(), react(), contember()],
	}
})
