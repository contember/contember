import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'

export const postWithNullableLocale = new SchemaBuilder()
	.entity('Post', e =>
		e.oneHasMany('locales', r =>
			r.ownedBy('post').target('PostLocale', e =>
				e
					.unique(['locale', 'post'])
					.column('title', c => c.type(Model.ColumnType.String))
					.column('locale', c => c.type(Model.ColumnType.String)),
			),
		),
	)
	.buildSchema()

export const postWithLocale = new SchemaBuilder()
	.entity('Post', e =>
		e.oneHasMany('locales', r =>
			r
				.ownedBy('post')
				.ownerNotNull()
				.target('PostLocale', e =>
					e
						.unique(['locale', 'post'])
						.column('title', c => c.type(Model.ColumnType.String))
						.column('locale', c => c.type(Model.ColumnType.String)),
				),
		),
	)
	.buildSchema()
