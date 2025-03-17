import { createHash } from 'node:crypto'
import { Plugin } from 'vite'

/**
 * Configuration options for the Contember Vite plugin
 */
export type ContemberOptions = {
	/**
	 * Add build version meta tag (defaults to true in production)
	 */
	buildVersion?: boolean
	/**
	 * Disable SPA routing middleware
	 */
	disableMiddleware?: boolean
	/**
	 * Path to the app (defaults to '/app')
	 */
	appPath?: string
}

const extractProjectNameFromDsn = (dsn: string | undefined) => {
	if (!dsn) return null

	try {
		return new URL(dsn).username || null
	} catch (e) {
		console.warn('Invalid Contember DSN format:', dsn)
		return null
	}
}

const createBuildVersionTag = (html: string): {
	tag: string
	injectTo: 'head'
	attrs: Record<string, string>
} => {
	const fileHash = createHash('md5').update(html).digest('hex')
	return {
		tag: 'meta',
		injectTo: 'head',
		attrs: {
			name: 'contember-build-version',
			content: fileHash,
		},
	}
}

/**
 * ## Contember Vite Plugin
 *
 * This plugin provides configuration enhancements for Vite when working with Contember applications.
 * It allows setting up SPA routing, injecting build version metadata, and defining project-specific environment variables.
 *
 * #### Features:
 * - Adds a build version meta tag (optional, enabled by default in production)
 * - Configures SPA routing middleware
 * - Supports defining project name from the Contember DSN
 * - Customizable app path
 *
 * #### Example Usage:
 * ```ts
 * import { defineConfig } from 'vite';
 * import contember from './contember';
 *
 * export default defineConfig({
 *   plugins: [contember({ buildVersion: true, appPath: '/custom-app' })],
 * });
 * ```
 */
export const contember = (options?: ContemberOptions): Plugin => {
	const {
		appPath = '/app',
		buildVersion = process.env.NODE_ENV === 'production',
		disableMiddleware = false,
	} = options || {}

	const normalizedAppPath = appPath.startsWith('/') ? appPath : `/${appPath}`
	const contemberDsn = process.argv.find(it => it.includes('contember://')) || process.env.CONTEMBER_DSN
	const projectName = extractProjectNameFromDsn(contemberDsn)

	const defineConfig = projectName
		? { 'import.meta.env.VITE_CONTEMBER_ADMIN_PROJECT_NAME': JSON.stringify(projectName) }
		: {}

	return {
		name: 'contember',

		config(config) {
			return {
				define: defineConfig,
				base: '/',
				...config,
				build: {
					sourcemap: true,
					...config.build,
					rollupOptions: {
						...config.build?.rollupOptions,
						input: config.build?.rollupOptions?.input ?? {
							root: './index.html',
							app: `.${normalizedAppPath}/index.html`,
						},
					},
				},
			}
		},

		configureServer(server) {
			if (disableMiddleware) return

			server.middlewares.use((req, res, next) => {
				const [pathname] = req.url?.split('?') ?? []

				const isSpaRoute = pathname === normalizedAppPath ||
					(pathname.startsWith(`${normalizedAppPath}/`) && !pathname.match(/\.\w+$/))

				if (isSpaRoute) {
					req.url = `${normalizedAppPath}/`
				}

				next()
			})
		},

		transformIndexHtml: buildVersion
			? {
				order: 'post',
				handler: (html, ctx) => {
					// Skip in dev server unless explicitly enabled
					if (ctx.server && options?.buildVersion !== true) {
						return { html, tags: [] }
					}

					return {
						html,
						tags: [createBuildVersionTag(html)],
					}
				},
			}
			: undefined,
	}
}

export default contember
