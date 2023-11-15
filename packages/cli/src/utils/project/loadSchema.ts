import { Project } from '@contember/cli-common'
import { Schema } from '@contember/schema'
import * as esbuild from 'esbuild'
import { join } from 'node:path'
import { schemaType } from '@contember/schema-utils'

export const loadSchema = async (project: Project): Promise<Schema> => {
	const response = await esbuild.build({
		entryPoints: [join(project.apiDir, 'index.ts')],
		platform: 'node',
		bundle: true,
		treeShaking: true,
		write: false,
		loader: { '.sql': 'text' },
		external: ['@contember/admin', 'react', 'react/jsx-runtime'],
	})
	const bundledJs = response.outputFiles[0].text

	const fn = new Function('require', `var module = {}; ((module) => { ${bundledJs} })(module); return module`)

	const schema = fn(require).exports.default
	return schemaType(schema)
}
