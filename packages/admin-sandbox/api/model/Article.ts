import { SchemaDefinition as d } from '@contember/schema-definition'

export class Article {
	title = d.stringColumn()
	content = d.stringColumn()
	publishedAt = d.dateTimeColumn()
	category = d.manyHasOne(Category)
	tags = d.manyHasMany(Tag)
}

export class Category {
	name = d.stringColumn()
}

export class Tag {
	name = d.stringColumn()
}
