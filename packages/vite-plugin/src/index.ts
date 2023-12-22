import { createHash } from 'node:crypto'
import { Plugin } from 'vite'

type ContemberOptions = {
	buildVersion?: boolean
}

export function contember(options?: ContemberOptions): Plugin {
	return ({
		name: 'contember',
		transformIndexHtml: options?.buildVersion === false
			? undefined
			: {
				order: 'post',
				handler: html => {
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
