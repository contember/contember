import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => ({
	base: command === 'build'
		? `/${loadEnv(mode, __dirname).VITE_CONTEMBER_ADMIN_PROJECT_NAME}/`
		: '/',
}))
