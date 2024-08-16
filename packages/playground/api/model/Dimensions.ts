import { c } from '@contember/schema-definition'

export class DimensionsLocale {
	code = c.stringColumn().notNull().unique()
	label = c.stringColumn().notNull()
}

export class DimensionsItem {
	unique = c.enumColumn(c.createEnum('unique')).unique().notNull().default('unique')
	locales = c.oneHasMany(DimensionsItemLocale, 'item')
}

@c.Unique('item', 'locale')
export class DimensionsItemLocale {
	item = c.manyHasOne(DimensionsItem, 'locales').notNull()
	locale = c.manyHasOne(DimensionsLocale).notNull()
	title = c.stringColumn().notNull()
	content = c.stringColumn()
}
