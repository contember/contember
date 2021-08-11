import { Schema } from '@contember/schema'
import { InputValidation, PermissionsBuilder, SchemaDefinition } from '@contember/schema-definition'
import * as modelDefinition from './model'

const model = SchemaDefinition.createModel(modelDefinition)

const schema: Schema = {
	acl: {
		roles: {
			admin: {
				variables: {},
				stages: '*',
				entities: PermissionsBuilder.create(model).allowAll().allowCustomPrimary().permissions,
				s3: {
					'**': {
						upload: true,
						read: true,
					},
				},
			},
		},
	},
	model: model,
	validation: InputValidation.parseDefinition(modelDefinition),
}

export default schema
