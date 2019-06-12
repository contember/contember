import { Schema } from 'cms-common'
import { emptySchema } from '../../../src/content-schema/schemaUtils'
import * as definitions from './model'
import { createModel } from '../../../src/content-schema/definition'
import { parseDefinition } from '../../../src/content-api/input-validation'

const model = createModel(definitions)
const schema: Schema = {
	...emptySchema,
	validation: parseDefinition(definitions),
	model,
}

export default schema
