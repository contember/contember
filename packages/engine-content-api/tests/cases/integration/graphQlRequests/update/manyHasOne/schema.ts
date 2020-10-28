import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'

export const postWithAuthor = new SchemaBuilder()
	.entity('Post', e =>
		e
			.manyHasOne('author', r => r.target('Author').notNull().inversedBy('posts').onDelete(Model.OnDelete.cascade))
			.column('title', c => c.type(Model.ColumnType.String)),
	)
	.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
	.buildSchema()

export const postWithNullableAuthor = new SchemaBuilder()
	.entity('Post', e =>
		e.manyHasOne('author', r => r.target('Author').inversedBy('posts').onDelete(Model.OnDelete.setNull)),
	)
	.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
	.buildSchema()
