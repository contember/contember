import { Project } from '@contember/cli-common'
import { Schema } from '@contember/schema'
import { join } from 'node:path'
import { schemaType } from '@contember/schema-utils'
import { buildJs } from '../esbuild'

export const loadSchema = async (project: Project): Promise<Schema> => {
	const bundledJs = await buildJs(join(project.apiDir, 'index.ts'))

	const fn = new Function('require', `var module = {}; ((module) => { ${bundledJs} })(module); return module`)

	const schema = fn(require).exports.default
	return schemaType(schema)
}
