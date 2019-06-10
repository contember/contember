import { Schema } from 'cms-common'
import { emptySchema } from '../../../src/content-schema/schemaUtils'
import * as definitions from './model'
import { createModel } from '../../../src/content-schema/definition'

const model = createModel(definitions)
const schema: Schema = {
	...emptySchema,
	model,
}

export default schema
