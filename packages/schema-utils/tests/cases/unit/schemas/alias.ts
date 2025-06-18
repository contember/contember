import { c } from '@contember/schema-definition'

export class Article {
	title = c.stringColumn().alias('name')
	author = c.manyHasOne(Author, 'articles').alias('a')
}

export class Author {
	articles = c.oneHasMany(Article, 'author')
}
