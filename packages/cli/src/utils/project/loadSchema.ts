import { Project } from '@contember/cli-common'
import { Schema } from '@contember/schema'
import { join } from 'node:path'
import { NodeVM } from 'vm2'
import { schemaType } from '@contember/schema-utils'
import { buildJs } from '../esbuild'

export const loadSchema = async (project: Project): Promise<Schema> => {
	const bundledJs = await buildJs(join(project.apiDir, 'index.ts'))
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
