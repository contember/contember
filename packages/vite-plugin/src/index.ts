import { createHash } from 'node:crypto'
import { Plugin } from 'vite'

type ContemberOptions = {
	buildVersion?: boolean
	disableMiddleware?: boolean
	appPath?: string
}

export function contember(options?: ContemberOptions): Plugin {
	const appPath = options?.appPath ?? '/app'
	const contemberDsn = process.argv.find(it => it.includes('contember://'))
	const projectName = contemberDsn ? new URL(contemberDsn).username : null

	const defineConfig = projectName ? {
		'import.meta.env.VITE_CONTEMBER_ADMIN_PROJECT_NAME': JSON.stringify(projectName),
	} : {}

	return ({
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
							app: `.${appPath}/index.html`,
						},
					},
				},
			}
		},
		configureServer(serve) {
			if (!options?.disableMiddleware) {
				serve.middlewares.use((req, res, next) => {
					if (req.url === appPath || req.url?.startsWith(`${appPath}/`) && !req.url?.match(/\.\w+($|\?)/)) {
						req.url = `${appPath}/`
					}
					next()
				})
			}
		},
		transformIndexHtml: options?.buildVersion === false
			? undefined
			: {
				order: 'post',
				handler: (html, ctx) => {
					if (ctx.server && options?.buildVersion !== true) {
						return { html, tags: [] }
					}

					const fileHash = createHash('md5').update(html).digest().toString('hex')
					return ({
						html,
						tags: [
							{
								tag: 'meta',
								injectTo: 'head',
								attrs: {
									name: 'contember-build-version',
									content: fileHash,
								},
							},
						],
					})
				},
			},
	})
}

export default contember
