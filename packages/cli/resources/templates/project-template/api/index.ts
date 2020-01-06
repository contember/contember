import { InputValidation, SchemaDefinition } from '@contember/schema-definition'
import { Schema } from '@contember/schema'
import * as modelDefinition from './model'
import aclFactory from './acl'

const model = SchemaDefinition.createModel(modelDefinition)

const schema: Schema = {
	model: model,
	acl: aclFactory(model),
	validation: InputValidation.parseDefinition(modelDefinition),
}

export default schema
