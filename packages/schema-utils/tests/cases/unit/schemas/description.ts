import { c } from '@contember/schema-definition'

@c.Description('This is an article entity for testing description fields')
export class Article {
	title = c.stringColumn().description('This is the title field description')
	content = c.stringColumn().description('This is the content field description')
	subtitle = c.stringColumn().notNull().description('This is a required subtitle field')
	slug = c.stringColumn().description('This is a unique slug field')
	author = c.manyHasOne(Author, 'articles').description('This is the author relation description')
	authors = c.manyHasMany(Author, 'authorArticles').description('These are the authors in many-to-many relation')
	tags = c.manyHasMany(Tag, 'articles').description('These are article tags')
	category = c.manyHasOne(Category, 'articles').notNull().description('Required category relation')
	publishedAt = c.dateTimeColumn().description('Publication date with nullable description')
}

@c.Description('This is an author entity with various relations')
export class Author {
	name = c.stringColumn().notNull().description('Author full name')
	email = c.stringColumn().description('Author email address must be unique')
	bio = c.stringColumn().description('Author biography text')
	articles = c.oneHasMany(Article, 'author').description('Articles written by this author')
	authorArticles = c.manyHasManyInverse(Article, 'authors').description('Articles co-authored by this author')
	profileImage = c.stringColumn().description('Optional profile image URL')
}

@c.Description('Category for organizing articles')
export class Category {
	name = c.stringColumn().notNull().description('Category name')
	parent = c.manyHasOne(Category, 'children').description('Parent category if exists')
	children = c.oneHasMany(Category, 'parent').description('Child categories')
	articles = c.oneHasMany(Article, 'category').description('Articles in this category')
}

@c.Description('Tag entity for categorizing articles')
export class Tag {
	name = c.stringColumn().notNull().description('Tag name must be unique')
	articles = c.manyHasManyInverse(Article, 'tags').description('Articles with this tag')
}
