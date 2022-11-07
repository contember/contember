import { SchemaDefinition } from './model'
import * as InputValidation from './validation'
import * as AclDefinition from './acl/definition'
import { Schema } from '@contember/schema'
import { emptySchema } from '@contember/schema-utils'

export const createSchema = (definitions: Record<string, any>, modifyCallback?: (schema: Schema) => Schema): Schema => {
	const model = SchemaDefinition.createModel(definitions)
	const validation = InputValidation.parseDefinition(definitions)
	const acl = AclDefinition.createAcl(definitions, model)
	const schema = { ...emptySchema, model, validation, acl }
	return modifyCallback ? modifyCallback(schema) : schema
}
