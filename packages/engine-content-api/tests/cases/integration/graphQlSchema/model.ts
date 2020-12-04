import { SchemaDefinition as d } from '@contember/schema-definition'

export const Locale = d.createEnum('cs', 'en')

export class Author {
	name = d.stringColumn()
	posts: d.OneHasManyDefinition = d.oneHasMany(Post, 'author').orderBy('publishedAt', d.OrderDirection.desc)
}

export class Post {
	state = d.enumColumn(d.createEnum('draft', 'forReview', 'published'))
	publishedAt = d.dateTimeColumn()

	categories = d.manyHasMany(Category, 'posts')
	author = d.manyHasOne(Author, 'posts')
	locales = d.oneHasMany(PostLocale, 'post')
}

@d.Unique('post', 'locale')
export class PostLocale {
	locale = d.enumColumn(Locale)

	title = d.stringColumn()

	post: d.ManyHasOneDefinition = d.manyHasOne(Post, 'locales')
}

export class Category {
	name = d.stringColumn().unique()

	posts: d.ManyHasManyInverseDefinition = d.manyHasManyInverse(Post, 'categories')
}
