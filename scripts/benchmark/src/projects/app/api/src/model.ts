import { AllowAllPermissionFactory, SchemaBuilder } from '@contember/schema-definition'
import { Acl, Model, Schema } from '@contember/schema'
import { emptySchema } from '@contember/schema-utils'

const builder = new SchemaBuilder()

// Extension things
builder.enum('One', ['One'])

builder.entity('Locale', entity =>
	entity.column('slug', column => column.type(Model.ColumnType.String).unique()).column('title'),
)

builder.entity('Linkable', entity =>
	entity //
		.column('url', col =>
			col //
				.type(Model.ColumnType.String)
				.notNull()
				.unique(),
		),
)

builder.entity('Redirect', entity =>
	entity
		.oneHasOne('link', ref =>
			ref //
				.target('Linkable')
				.inversedBy('redirect')
				.notNull(),
		)
		.manyHasOne('target', ref =>
			ref //
				.target('Linkable')
				.notNull(),
		),
)

builder.enum('State', ['Draft', 'ToBePublished', 'Published'])

builder.entity('Image', entity => entity.column('url'))

builder.entity('Video', entity =>
	entity.column('url').manyHasOne('poster', relation => relation.target('Image').onDelete(Model.OnDelete.cascade)),
)

builder.entity('Seo', entity =>
	entity
		.column('title')
		.oneHasOne('ogImage', relation => relation.target('Image').onDelete(Model.OnDelete.cascade))
		.column('description')
		.column('ogTitle')
		.column('ogDescription'),
)

builder.entity('ImageGrid', entity =>
	entity
		.manyHasOne('imagePosition1', ref => ref.target('Image').onDelete(Model.OnDelete.cascade))
		.manyHasOne('imagePosition2', ref => ref.target('Image').onDelete(Model.OnDelete.cascade))
		.manyHasOne('imagePosition3', ref => ref.target('Image').onDelete(Model.OnDelete.cascade)),
)

builder.enum('BlockType', ['Heading', 'Text', 'Image', 'ImageGrid', 'People', 'Category'])

builder.entity('Block', entity =>
	entity
		.column('order', col => col.type(Model.ColumnType.Int))
		.column('type', col => col.type(Model.ColumnType.Enum, { enumName: 'BlockType' }))
		.column('text')
		.manyHasOne('imageGrid', ref => ref.target('ImageGrid'))
		.manyHasOne('image', ref => ref.target('Image'))
		.manyHasOne('category', ref => ref.target('Category').onDelete(Model.OnDelete.cascade))
		.oneHasMany('people', ref =>
			ref.target('BlockPerson', entity =>
				entity
					.column('order', col => col.type(Model.ColumnType.Int))
					.manyHasOne('person', ref => ref.target('Person').onDelete(Model.OnDelete.cascade)),
			),
		),
)

// Menu
builder.entity('MenuItem', entity =>
	entity
		.column('order', col => col.type(Model.ColumnType.Int))
		.oneHasMany('locales', ref =>
			ref //
				.target('MenuItemLocale')
				.ownedBy('menuItem')
				.onDelete(Model.OnDelete.cascade)
				.ownerNotNull(),
		),
)

builder.entity('MenuItemLocale', entity =>
	entity
		.column('label')
		.manyHasOne('target', ref => ref.target('Linkable').notNull())
		.manyHasOne('locale', ref => ref.target('Locale').notNull())
		.unique(['menuItem', 'locale']),
)

// Footer
builder.entity('Footer', entity =>
	entity
		.column('unique', col =>
			col //
				.type(Model.ColumnType.Enum, { enumName: 'One' })
				.notNull()
				.unique(),
		)
		.oneHasMany('locales', ref =>
			ref //
				.target('FooterLocale')
				.ownedBy('footer')
				.onDelete(Model.OnDelete.cascade)
				.ownerNotNull(),
		),
)

builder.entity('FooterLocale', entity =>
	entity
		.manyHasOne('locale', ref => ref.target('Locale').notNull())
		.column('address')
		.unique(['footer', 'locale']),
)

builder.entity('Person', entity =>
	entity
		.column('order', col => col.type(Model.ColumnType.Int))
		.manyHasOne('image', ref => ref.target('Image').onDelete(Model.OnDelete.cascade))
		.column('email')
		.oneHasMany('locales', ref =>
			ref //
				.target('PersonLocale')
				.ownedBy('person')
				.onDelete(Model.OnDelete.cascade),
		),
)
builder.entity('PersonLocale', entity =>
	entity
		.manyHasOne('locale', ref => ref.target('Locale').notNull())
		.column('quote')
		.column('name')
		.column('position')
		.unique(['person', 'locale']),
)

// Page
builder.entity('Page', entity =>
	entity
		.oneHasMany('locales', ref =>
			ref //
				.target('PageLocale')
				.ownedBy('page')
				.onDelete(Model.OnDelete.cascade),
		)
		.manyHasOne('image', ref => ref.target('Image').onDelete(Model.OnDelete.cascade))
		.manyHasOne('category', ref =>
			ref //
				.target('Category')
				.onDelete(Model.OnDelete.setNull)
				.inversedBy('pages'),
		),
)

builder.entity('PageLocale', entity =>
	entity
		.column('state', col => col.type(Model.ColumnType.Enum, { enumName: 'State' }).notNull())
		.column('header')
		.column('perex')
		.oneHasMany('content', ref => ref.target('Block').onDelete(Model.OnDelete.cascade))
		.column('contactUs')
		.oneHasOne('seo', ref =>
			ref //
				.target('Seo')
				.notNull()
				.onDelete(Model.OnDelete.cascade),
		)
		.manyHasOne('locale', ref => ref.target('Locale').notNull())
		.oneHasOne('link', ref =>
			ref //
				.target('Linkable')
				.inversedBy('page')
				.notNull(),
		)
		.unique(['page', 'locale']),
)

// Category + CategoryLocale

builder.entity('Category', entity =>
	entity.oneHasMany('locales', ref =>
		ref
			.target('CategoryLocale', entity =>
				entity
					.column('name')
					.unique(['category', 'locale'])
					.manyHasOne('locale', ref => ref.target('Locale').notNull()),
			)
			.onDelete(Model.OnDelete.cascade)
			.ownedBy('category')
			.ownerNotNull(),
	),
)

// Contact
builder.entity('Contact', entity =>
	entity
		.column('unique', col =>
			col //
				.type(Model.ColumnType.Enum, { enumName: 'One' })
				.notNull()
				.unique(),
		)
		.oneHasMany('locales', ref =>
			ref //
				.target('ContactLocale')
				.ownedBy('contact')
				.onDelete(Model.OnDelete.cascade)
				.ownerNotNull(),
		),
)

builder.entity('ContactLocale', entity =>
	entity
		.manyHasOne('locale', ref => ref.target('Locale').notNull())
		.column('header')
		.oneHasOne('seo', ref =>
			ref //
				.target('Seo')
				.notNull()
				.onDelete(Model.OnDelete.cascade),
		)
		.oneHasOne('link', ref =>
			ref //
				.target('Linkable')
				.inversedBy('contact')
				.notNull(),
		)
		.unique(['contact', 'locale']),
)

const model = builder.buildSchema()
const acl: Acl.Schema = {
	roles: {
		admin: {
			variables: {},
			stages: '*',
			entities: new AllowAllPermissionFactory().create(model),
		},
	},
}

const schema: Schema = {
	...emptySchema,
	model: model,
	acl: acl,
}

export default schema
