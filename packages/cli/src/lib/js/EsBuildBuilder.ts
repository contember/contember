import { JsBuilder } from './JsBuilder'
import * as esbuild from 'esbuild'

export class EsBuildBuilder implements JsBuilder {
	async build(path: string): Promise<string> {
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
