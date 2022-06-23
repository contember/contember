import { SchemaDefinition } from './model/index.js'
import * as InputValidation from './validation/index.js'
import * as AclDefinition from './acl/definition/index.js'
import { Schema } from '@contember/schema'

export const createSchema = (definitions: Record<string, any>, modifyCallback?: (schema: Schema) => Schema): Schema => {
	const model = SchemaDefinition.createModel(definitions)
	const validation = InputValidation.parseDefinition(definitions)
	const acl = AclDefinition.createAcl(definitions, model)
	const schema = { model, validation, acl }
	return modifyCallback ? modifyCallback(schema) : schema
}
