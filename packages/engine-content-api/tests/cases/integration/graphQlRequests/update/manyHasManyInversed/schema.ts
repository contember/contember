import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'

export const postWithCategories = new SchemaBuilder()
	.entity('Post', e =>
		e
			.manyHasMany('categories', r => r.target('Category').inversedBy('posts'))
			.column('title', c => c.type(Model.ColumnType.String)),
	)
	.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
	.buildSchema()
