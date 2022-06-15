import { SchemaDefinition as d } from '@contember/schema-definition'
import { BasicImage } from './Files'
import { Locale } from './Locale'

export const ArticleState = d.createEnum('draft', 'published', 'removed')
export class Article {
	title = d.stringColumn()
	slug = d.stringColumn().unique()
	image = d.manyHasOne(BasicImage)
	content = d.stringColumn()
	publishedAt = d.dateTimeColumn()
	category = d.manyHasOne(Category)
	tags = d.manyHasMany(Tag)
	state = d.enumColumn(ArticleState)
	number = d.intColumn().default(1) // for testing NumberCell
	sortedTags = d.oneHasMany(ArticleTag, 'article').orderBy('order')
}

export class ArticleTag {
	article = d.manyHasOne(Article, 'sortedTags').notNull()
	tag = d.manyHasOne(Tag).notNull()
	order = d.intColumn().notNull()
}

export class Category {
	name = d.stringColumn()
	locales = d.oneHasMany(CategoryLocale, 'category')
	order = d.intColumn()
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
	order = d.intColumn()
}
