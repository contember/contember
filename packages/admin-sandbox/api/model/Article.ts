import { SchemaDefinition as d } from '@contember/schema-definition'
import { Locale } from './Locale'

export const ArticleState = d.createEnum('draft', 'published', 'removed')
export class Article {
	title = d.stringColumn()
	slug = d.stringColumn().unique()
	content = d.stringColumn()
	publishedAt = d.dateTimeColumn()
	category = d.manyHasOne(Category)
	tags = d.manyHasMany(Tag)
	state = d.enumColumn(ArticleState)
}

export class Category {
	name = d.stringColumn()
	locales = d.oneHasMany(CategoryLocale, 'category')
}


@d.Unique('locale', 'category')
export class CategoryLocale {
	category = d.manyHasOne(Category, 'locales')
	locale = d.manyHasOne(Locale)
	name = d.stringColumn().notNull()
}


export class Tag {
	name = d.stringColumn()
	locales = d.oneHasMany(TagLocale, 'tag')
}


@d.Unique('locale', 'tag')
export class TagLocale {
	tag = d.manyHasOne(Tag, 'locales')
	locale = d.manyHasOne(Locale)
	name = d.stringColumn().notNull()
}
