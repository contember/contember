import { Project } from '@contember/cli-common'
import { Schema } from '@contember/schema'
import * as esbuild from 'esbuild'
import { join } from 'path'
import { NodeVM } from 'vm2'

export const loadSchema = async (project: Project): Promise<Schema> => {
	const response = await esbuild.build({
		entryPoints: [join(project.apiDir, 'index.ts')],
		platform: 'node',
		bundle: true,
		treeShaking: true,
		write: false,
		external: ['@contember/admin', 'react', 'react/jsx-runtime'],
	})
	const bundledJs = response.outputFiles[0].text
	const vm = new NodeVM({
		require: {
			builtin: ['*'],
		},
	})
	return (await vm.run(bundledJs)).default
}
