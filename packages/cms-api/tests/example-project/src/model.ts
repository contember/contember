import * as d from '../../../src/content-schema/definition'
import * as v from '../../../src/content-api/input-validation'

export class Author {
	@v.required('Author name is required')
	name = d.stringColumn()
	@v.required('Contact is required')
	contact: d.OneHasOneDefinition = d.oneHasOne(AuthorContact, 'author')
	@v.optional()
	posts: d.OneHasManyDefinition = d.oneHasMany(Post, 'author')
}

export class AuthorContact {
	@v.required('Contact e-mail is required')
	@v.assertPattern(/^.+@.+$/, 'E-mail is invalid')
	email = d.stringColumn()
	author = d.oneHasOneInversed(Author, 'contact')
}

export class Post {
	@v.required('Post title is required')
	title = d.stringColumn()
	@v.required('Post content is required')
	content = d.stringColumn()
	@v.required('Post author is required')
	author = d.manyHasOne(Author, 'posts')
	@v.required('Post tags are required')
	@v.assertMinLength(2, 'Please fill at least two tags')
	tags: d.ManyHasManyDefinition = d.manyHasMany(Tag, 'posts')
}

export class Tag {
	@v.required('Tag label is required')
	label = d.stringColumn()
	posts = d.manyHasManyInversed(Post, 'tags')
}
