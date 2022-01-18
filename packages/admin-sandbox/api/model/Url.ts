import { SchemaDefinition as d } from '@contember/schema-definition'
import { Article, Category, Tag } from './Article'

export const UrlType = d.createEnum('article', 'category', 'tag')

@d.Unique('url')
export class Url {
	url = d.stringColumn().notNull()
	type = d.enumColumn(UrlType).notNull()
	article = d.oneHasOne(Article).cascadeOnDelete()
	category = d.oneHasOne(Category).cascadeOnDelete()
	tag = d.oneHasOne(Tag).cascadeOnDelete()
}
