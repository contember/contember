import { c } from '@contember/schema-definition'

export class Article {
	title = c.stringColumn().deprecated('Use `name` instead')
	author = c.manyHasOne(Author, 'articles').deprecated('Do not use')
}

export class Author {
	articles = c.oneHasMany(Article, 'author')
}
