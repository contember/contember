import { Project } from '@contember/cli-common'
import { Schema } from '@contember/schema'
import * as esbuild from 'esbuild'
import { join } from 'path'
import { NodeVM } from 'vm2'
import { schemaType } from '@contember/schema-utils'

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
	const schema = await vm.run(bundledJs).default
	// https://github.com/patriksimek/vm2/issues/198
	const fixedSchema = JSON.parse(JSON.stringify(schema))
	return schemaType(fixedSchema)
}
