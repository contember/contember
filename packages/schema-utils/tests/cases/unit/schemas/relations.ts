import { c } from '@contember/schema-definition'

export class Article {
	title = c.stringColumn()
	category = c.manyHasOne(Category, 'articles')
	tags = c.manyHasMany(Tag, 'articles')
}

export class Category {
	name = c.stringColumn()
	articles = c.oneHasMany(Article, 'category')
}

export class Tag {
	name = c.stringColumn()
	tags = c.manyHasManyInverse(Article, 'tags')
}
