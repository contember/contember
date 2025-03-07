import { c } from '@contember/schema-definition'

export const GridArticleState = c.createEnum('published', 'draft', 'archived')

export class GridArticle {
	title = c.stringColumn().collation('und-x-icu')
	slug = c.stringColumn().notNull().unique()
	state = c.enumColumn(GridArticleState)
	target = c.enumColumn(c.createEnum('a', 'b', 'c')).list()
	locked = c.boolColumn().default(false)
	publishedAt = c.dateTimeColumn()
	publishDate = c.dateColumn()
	author = c.manyHasOne(GridAuthor)
	category = c.manyHasOne(GridCategory)
	tags = c.manyHasMany(GridTag)
	views = c.intColumn()
	comments = c.oneHasMany(GridArticleComment, 'article')
	details = c.oneHasOneInverse(GridArticleDetail, 'article')
}

export class GridTag {
	name = c.stringColumn().notNull().collation('cs-x-icu')
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

export class GridArticleComment {
	article = c.manyHasOne(GridArticle, 'comments').notNull().cascadeOnDelete()
	author = c.manyHasOne(GridAuthor).notNull().cascadeOnDelete()
	content = c.stringColumn()
	createdAt = c.dateTimeColumn()
}

@c.View(`
	SELECT
		article.id AS id,
		article.id AS article_id,
		(SELECT COUNT(*)
		 FROM "grid_article_comment" comment
		 WHERE comment.article_id = article.id) AS comments_count
	FROM "grid_article" article;
`)
export class GridArticleDetail {
	article = c.oneHasOne(GridArticle, 'details').notNull()
	commentsCount = c.intColumn().notNull()
}
