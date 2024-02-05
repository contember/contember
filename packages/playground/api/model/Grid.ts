import { c } from '@contember/schema-definition'

export const GridArticleState = c.createEnum('published', 'draft', 'archived')

export class GridArticle {
	title = c.stringColumn().notNull()
	slug = c.stringColumn().notNull().unique()
	state = c.enumColumn(GridArticleState).notNull()
	locked = c.boolColumn().notNull().default(false)
	publishedAt = c.dateTimeColumn()
	author = c.manyHasOne(GridAuthor)
	category = c.manyHasOne(GridCategory)
	tags = c.manyHasMany(GridTag)
}

export class GridTag {
	name = c.stringColumn().notNull()
	slug = c.stringColumn().notNull().unique()
}

export class GridCategory {
	name = c.stringColumn().notNull()
	slug = c.stringColumn().notNull().unique()
}

export class GridAuthor {
	name = c.stringColumn().notNull()
	slug = c.stringColumn().notNull().unique()
}
