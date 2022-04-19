import { AllowAllPermissionFactory } from '@contember/schema-utils'
import PermissionsBuilder from './acl/builder/PermissionsBuilder'
import * as InputValidation from './validation'
import { SchemaDefinition } from './model'
import { Schema } from '@contember/schema'
import * as AclDefinition from './acl/definition'

export * from './model'

export const createSchema = (definitions: Record<string, any>, modifyCallback?: (schema: Schema) => Schema): Schema => {
	const model = SchemaDefinition.createModel(definitions)
	const validation = InputValidation.parseDefinition(definitions)
	const acl = AclDefinition.createAcl(definitions, model)
	const schema = { model, validation, acl }
	return modifyCallback ? modifyCallback(schema) : schema
}

export { AllowAllPermissionFactory, PermissionsBuilder, InputValidation, AclDefinition }
