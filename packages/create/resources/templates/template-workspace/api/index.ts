import { createSchema, settingsPresets } from '@contember/schema-definition'
import * as model from './model'

export default createSchema(model, schema => ({
	...schema,
	settings: settingsPresets['v1.4'],
}))
