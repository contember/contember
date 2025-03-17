import { describe, it, expect, beforeEach, afterEach, spyOn, mock } from 'bun:test'
import contember from '../../../src'
import { ConfigEnv, UserConfig, Plugin } from 'vite'

const invokePluginHook = (plugin: Plugin, hookName: string, ...args: any[]) => {
	const hook = plugin[hookName]
	if (typeof hook === 'function') {
		return hook(...args)
	} else if (hook?.handler) {
		return hook.handler(...args)
	}
	return undefined
}

const createMockServer = () => {
	return {
		middlewares: {
			use: mock(() => { }),
		},
	}
}

const getPluginConfigResult = (plugin: Plugin) => {
	const userConfig = {} as UserConfig
	const configEnv = {} as ConfigEnv
	const result = invokePluginHook(plugin, 'config', userConfig, configEnv) || {}

	return result as UserConfig & {
		define?: Record<string, string>
		base?: string
		build?: {
			sourcemap?: boolean
			rollupOptions?: {
				input?: Record<string, string>
				output?: Record<string, any>
			}
		}
	}
}

describe('contember vite plugin', () => {
	const originalEnv = process.env
	const originalArgv = process.argv

	beforeEach(() => {
		process.env = { ...originalEnv }
		process.argv = [...originalArgv]
	})

	afterEach(() => {
		process.env = originalEnv
		process.argv = originalArgv
	})

	it('should create a plugin with default options', () => {
		const plugin = contember()
		expect(plugin).toBeDefined()
		expect(plugin.name).toBe('contember')
	})

	describe('server middleware', () => {
		it('should normalize app path correctly', () => {
			const plugin1 = contember({ appPath: 'test-app' })
			const plugin2 = contember({ appPath: '/test-app' })

			const mockServer1 = createMockServer()
			const mockServer2 = createMockServer()

			invokePluginHook(plugin1, 'configureServer', mockServer1)
			invokePluginHook(plugin2, 'configureServer', mockServer2)

			expect(mockServer1.middlewares.use).toHaveBeenCalled()
			expect(mockServer2.middlewares.use).toHaveBeenCalled()
		})

		it('should skip middleware when disableMiddleware is true', () => {
			const plugin = contember({ disableMiddleware: true })
			const mockServer = createMockServer()

			invokePluginHook(plugin, 'configureServer', mockServer)

			expect(mockServer.middlewares.use).not.toHaveBeenCalled()
		})

		it('should handle SPA routing middleware correctly', () => {
			const plugin = contember({ appPath: '/app' })
			const mockServerMiddleware = mock(() => { })
			const mockServer = { middlewares: { use: mockServerMiddleware } }

			invokePluginHook(plugin, 'configureServer', mockServer)

			const middleware = mockServerMiddleware.mock.calls[0][0]

			const testCases = [
				['/app', '/app/'],
				['/app/dashboard', '/app/'],
				['/app/settings/profile', '/app/'],
				['/api/data', '/api/data'],
				['/app/file.js', '/app/file.js'],
				['/app/image.png', '/app/image.png'],
				['/app?user=123', '/app/'],
				['/app?user=123&sort=desc,user', '/app/'],
				['/app?test.fakeExtension', '/app/'],
			]

			testCases.forEach(([url, expected]) => {
				const req = { url }
				const next = mock(() => { })

				middleware(req, {}, next)

				expect(req.url).toBe(expected)
				expect(next).toHaveBeenCalled()
			})
		})
	})

	describe('DSN handling', () => {
		it('should extract project name from CONTEMBER_DSN environment variable', () => {
			process.env.CONTEMBER_DSN = 'contember://project-name:token@example.com'
			const plugin = contember()
			const configResult = getPluginConfigResult(plugin)

			expect(configResult.define).toEqual({
				'import.meta.env.VITE_CONTEMBER_ADMIN_PROJECT_NAME': '"project-name"',
			})
		})

		it('should extract project name from command line arguments', () => {
			delete process.env.CONTEMBER_DSN
			process.argv.push('contember://arg-project:token@example.com')
			const plugin = contember()
			const configResult = getPluginConfigResult(plugin)

			expect(configResult.define).toEqual({
				'import.meta.env.VITE_CONTEMBER_ADMIN_PROJECT_NAME': '"arg-project"',
			})
		})

		it('should handle invalid DSN format', () => {
			process.env.CONTEMBER_DSN = 'invalid-dsn'
			const consoleSpy = spyOn(console, 'warn').mockImplementation(() => { })
			const plugin = contember()
			const configResult = getPluginConfigResult(plugin)

			expect(configResult.define).toEqual({})
			expect(consoleSpy).toHaveBeenCalled()
		})
	})

	describe('build version meta tag', () => {
		it('should not include build version meta tag in development', () => {
			process.env.NODE_ENV = 'development'
			const plugin = contember()
			expect(plugin.transformIndexHtml).toBeUndefined()
		})

		it('should add build version meta tag in production', () => {
			process.env.NODE_ENV = 'production'
			const plugin = contember()

			const transform = plugin.transformIndexHtml
			expect(transform).toBeDefined()

			const result = invokePluginHook(plugin, 'transformIndexHtml', '<html></html>', { server: false })

			expect(result.tags).toHaveLength(1)
			expect(result.tags[0].tag).toBe('meta')
			expect(result.tags[0].attrs.name).toBe('contember-build-version')
		})

		it('should respect buildVersion option (disabled)', () => {
			const plugin = contember({ buildVersion: false })
			expect(plugin.transformIndexHtml).toBeUndefined()
		})

		it('should respect buildVersion option (enabled)', () => {
			process.env.NODE_ENV = 'development'
			const plugin = contember({ buildVersion: true })

			const result = invokePluginHook(plugin, 'transformIndexHtml', '<html></html>', { server: true })

			expect(result.tags).toHaveLength(1)
		})
	})

	describe('vite configuration', () => {
		it('should configure vite with correct defaults', () => {
			const plugin = contember({ appPath: '/custom-app' })

			const userConfig = {
				build: {
					rollupOptions: {
						output: {
							format: 'esm',
						},
					},
				},
			} as UserConfig

			const configResult = invokePluginHook(plugin, 'config', userConfig, {} as ConfigEnv)

			expect(configResult.base).toBe('/')
			expect(configResult.build?.sourcemap).toBe(true)
			expect(configResult.build?.rollupOptions?.input).toEqual({
				root: './index.html',
				app: './custom-app/index.html',
			})
			// Should preserve existing options
			expect(configResult.build?.rollupOptions?.output).toEqual({ format: 'esm' })
		})
	})
})
