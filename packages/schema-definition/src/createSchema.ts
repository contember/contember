import { SchemaDefinition } from './model'
import * as InputValidation from './validation'
import * as AclDefinition from './acl/definition'
import * as ActionsDefinition from './actions/definition'
import { Schema } from '@contember/schema'
import { emptySchema } from '@contember/schema-utils'
import { allStrict, StrictOptions, StrictDefinitionValidator } from './strict'

export const createSchema = (definitions: Record<string, any>, modifyCallback?: (schema: Schema) => Schema, options?: {
	strict?: boolean | StrictOptions
}): Schema => {
	const strictOptions = options?.strict === true ? allStrict : (options?.strict || {})
	const strictDefinitionValidator = new StrictDefinitionValidator(strictOptions)

	const model = SchemaDefinition.createModel(definitions, { strictDefinitionValidator: strictDefinitionValidator })
	const validation = InputValidation.parseDefinition(definitions)
	const acl = AclDefinition.createAcl(definitions, model)
	const actions = ActionsDefinition.createActions(definitions)
	const schema = { ...emptySchema, model, validation, acl, actions }

	if (strictDefinitionValidator.warnings.length > 0) {
		throw `Strict schema validation failed: \n${strictDefinitionValidator.warnings.map(it => `- ${it.message}`).join('\n')}`
	}

	return modifyCallback ? modifyCallback(schema) : schema
}
