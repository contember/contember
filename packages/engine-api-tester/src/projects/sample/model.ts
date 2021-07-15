import { InputValidation as v, SchemaDefinition as d } from '@contember/schema-definition'

export class Author {
	@v.required('Author name is required')
	name = d.stringColumn()
	@v.required('Contact is required')
	contact: d.OneHasOneDefinition = d.oneHasOne(AuthorContact, 'author')
	// @v.optional()
	posts: d.OneHasManyDefinition = d.oneHasMany(Post, 'author')
}

export class AuthorContact {
	@v.required('Contact e-mail is required')
	@v.assertPattern(
		/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
		'E-mail is invalid',
	)
	email = d.stringColumn()
	author = d.oneHasOneInverse(Author, 'contact')
}

export class Post {
	@v.required('Post title is required')
	title = d.stringColumn()
	@v.required('Post content is required')
	content = d.stringColumn()
	@v.required('Post author is required')
	author = d.manyHasOne(Author, 'posts')
	// @v.required('Post tags are required')
	// @v.assertMinLength(2, 'Please fill at least two tags')
	tags: d.ManyHasManyDefinition = d.manyHasMany(Tag, 'posts')
}

export class Tag {
	@v.required('Tag label is required')
	label = d.stringColumn()
	posts = d.manyHasManyInverse(Post, 'tags')
}

export class Entry {
	number = d.intColumn()
}
