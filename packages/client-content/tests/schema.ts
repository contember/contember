import { c, createSchema } from '@contember/schema-definition'

namespace Schema {
	export class Locale {
		code = c.stringColumn().unique().notNull()
	}


	export class Author {
		name = c.stringColumn()
		email = c.stringColumn()
		posts = c.oneHasMany(Post, 'author')
	}

	export class Post {
		publishedAt = c.dateTimeColumn()
		tags = c.manyHasMany(Tag, 'posts')
		author = c.manyHasOne(Author, 'posts')
		locales = c.oneHasMany(PostLocale, 'post')
	}

	@c.Unique('locale', 'post')
	export class PostLocale {
		locale = c.manyHasOne(Locale, 'posts')
		title = c.stringColumn()
		content = c.stringColumn()
		post = c.manyHasOne(Post, 'locales')
	}

	export class Tag {
		name = c.stringColumn()
		posts = c.manyHasManyInverse(Post, 'tags')
	}
}


export const schema = createSchema(Schema)
