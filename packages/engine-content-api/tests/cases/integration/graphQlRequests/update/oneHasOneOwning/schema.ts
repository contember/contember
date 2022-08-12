import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'

export const siteSettingSchema = new SchemaBuilder()
	.entity('Site', entity =>
		entity
			.column('name', c => c.type(Model.ColumnType.String))
			.oneHasOne('setting', r =>
				r
					.inversedBy('site')
					.target('SiteSetting', e => e.column('url', c => c.type(Model.ColumnType.String).unique()))
					.onDelete(Model.OnDelete.setNull),
			),
	)
	.buildSchema()

export const siteSettingSchemaWithOrphanRemoval = new SchemaBuilder()
	.entity('Site', entity =>
		entity
			.column('name', c => c.type(Model.ColumnType.String))
			.oneHasOne('setting', r =>
				r
					.inversedBy('site')
					.target('SiteSetting', e => e.column('url', c => c.type(Model.ColumnType.String)))
					.removeOrphan(),
			),
	)
	.buildSchema()
