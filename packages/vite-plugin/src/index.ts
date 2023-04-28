import { createHash } from 'node:crypto'

type ContemberOptions = {
	buildVersion?: boolean
}

export function contember(options: ContemberOptions) {
	return ({
		name: 'contember',
		transformIndexHtml: options.buildVersion === false
			? undefined : {
				order: 'post',
				handler: (html: string) => {
					const fileHash = createHash('md5').update(html).digest().toString('hex')
					return ([
						{
							tag: 'meta',
							injectTo: 'head',
							attrs: {
								name: 'contember-build-version',
								content: fileHash,
							},
						},
					])
				},
			},
	})
}
