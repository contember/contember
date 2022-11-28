import { Schema } from '@contember/schema'
import { InputValidation, PermissionsBuilder, SchemaDefinition } from '@contember/schema-definition'
import * as modelDefinition from './model'

const model = SchemaDefinition.createModel(modelDefinition)

const schema: Schema = {
	settings: {},
	acl: {
		roles: {
			admin: {
				variables: {},
				stages: '*',
				entities: PermissionsBuilder.create(model).allowAll().allowCustomPrimary().permissions,
				s3: {
					'**': {
						upload: {
							maxSize: 1024 * 1024,
						},
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
