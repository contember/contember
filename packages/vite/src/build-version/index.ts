import { createHash } from 'crypto'

export function buildVersion() {
	return ({
		name: 'contember-build-version',
		transformIndexHtml: {
			order: 'post',
			handler: (html: string) => {
				const fileHash = createHash('md5').update(html).digest().toString('hex')
				return ([
					{
						tag: 'meta',
						injectTo: 'head',
						attrs: {
							name: 'contember-build-version',
							value: fileHash,
						},
					},
				])
			},
		},
	})
}
