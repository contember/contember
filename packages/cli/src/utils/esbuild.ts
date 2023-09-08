import * as esbuild from 'esbuild'

export const buildJs = async (path: string): Promise<string> => {
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
