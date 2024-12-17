import { JsBuilder } from './JsBuilder'

export class EsBuildBuilder implements JsBuilder {
	async build(path: string): Promise<string> {
		const esbuild = await import('esbuild')
		const response = await esbuild.build({
			entryPoints: [path],
			platform: 'node',
			bundle: true,
			treeShaking: true,
			write: false,
			loader: { '.sql': 'text' },
			external: ['@contember/admin', 'react', 'react/jsx-runtime'],
		})
		return response.outputFiles[0].text
	}
}
