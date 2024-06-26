import { c } from '@contember/schema-definition'

export class Slug {
	unique = c.enumColumn(c.createEnum('unique')).unique().notNull().default('unique')
	slug = c.stringColumn().notNull()
	title = c.stringColumn().notNull()
	category = c.manyHasOne(SlugCategory)
}

export class SlugCategory {
	name = c.stringColumn().notNull()
}
