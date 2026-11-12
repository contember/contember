import { c } from '@contember/schema-definition'

export const ArticleStatus = c.createEnum('draft', 'published', 'archived')

@c.Deprecated('This class is deprecated because it will be replaced in the next version')
export class Article {
	title = c.stringColumn().deprecated('Use `name` instead')
	name = c.stringColumn()
	content = c.stringColumn().deprecated('Content will be moved to a separate entity')
	isPublished = c.boolColumn().deprecated('Use `status` instead')
	status = c.enumColumn(ArticleStatus)
	rating = c.intColumn().deprecated()
	views = c.intColumn().notNull().default(0).deprecated('Will be calculated automatically')
	createdAt = c.dateTimeColumn().deprecated('Moving to BaseEntity')
	author = c.manyHasOne(Author, 'articles').deprecated('Do not use, use `primaryAuthor` instead')
	primaryAuthor = c.manyHasOne(Author)
	authors = c.manyHasMany(Author, 'authorArticles').deprecated('Do not use, use `contributors` instead')
	contributors = c.manyHasMany(Author, 'contributedArticles')
	singleAuthor = c.oneHasOne(Author, 'article').deprecated('Do not use')
	as = c.manyHasMany(Author).deprecated('Ambiguous relation name')
	a = c.oneHasOne(Author).deprecated('Ambiguous relation name')
	tags = c.manyHasMany(Tag, 'articles')
	category = c.manyHasOne(Category, 'articles')
}

@c.Deprecated()
export class Author {
	name = c.stringColumn()
	bio = c.stringColumn().deprecated()
	articles = c.oneHasMany(Article, 'author').deprecated()
	authorArticles = c.manyHasManyInverse(Article, 'authors').deprecated()
	contributedArticles = c.manyHasManyInverse(Article, 'contributors')
	article = c.oneHasOneInverse(Article, 'singleAuthor').deprecated()
}

export class Category {
	name = c.stringColumn()
	description = c.stringColumn().deprecated('Use `shortDescription` and `longDescription`')
	shortDescription = c.stringColumn()
	longDescription = c.stringColumn()
	parent = c.manyHasOne(Category, 'children').deprecated('Flattening category structure')
	children = c.oneHasMany(Category, 'parent').deprecated('Flattening category structure')
	articles = c.oneHasMany(Article, 'category')
}

export class Tag {
	name = c.stringColumn().notNull()
	articles = c.manyHasManyInverse(Article, 'tags')
}
