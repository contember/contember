import { defineWorkspace } from 'vitest/config'
import { resolveConfig } from './scripts/vite/resolveConfig'

export default defineWorkspace([
	{
		test: {
			include: ['packages/react-*/tests/**/*.test.{ts,tsx}'],
			name: 'browser',
			environment: 'jsdom',
		},
		resolve: resolveConfig,
	},

	{
		test: {
			include: ['packages/*/tests/cases/db/**/*.test.ts'],
			name: 'db',
			environment: 'node',
		},
		resolve: resolveConfig,
	},
	{
		test: {
			include: ['packages/*/tests/**/*.test.ts'],
			exclude: ['packages/react-*/tests/**/*.test.{ts,tsx}', 'packages/*/tests/cases/db/**/*.test.ts'],
			name: 'node',
			environment: 'node',
			// pool: 'vmThreads',
		},
		resolve: resolveConfig,
	},
	{
		test: {
			name: 'e2e',
			include: ['e2e/**/*.test.ts'],
			fileParallelism: false,
		},
		resolve: resolveConfig,
	},
])
