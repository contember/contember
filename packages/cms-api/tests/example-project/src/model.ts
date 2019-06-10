import * as d from '../../../src/content-schema/definition'

export class Author {
	name = d.stringColumn()
	contact: d.OneHasOneDefinition = d.oneHasOne(AuthorContact, 'author')
	posts: d.OneHasManyDefinition = d.oneHasMany(Post, 'author')
}

export class AuthorContact {
	email = d.stringColumn()
	author = d.oneHasOneInversed(Author, 'contact')
}

export class Post {
	title = d.stringColumn()
	content = d.stringColumn()
	author = d.manyHasOne(Author, 'posts')
	tags: d.ManyHasManyDefinition = d.manyHasMany(Tag, 'posts')
}

export class Tag {
	label = d.stringColumn()
	posts = d.manyHasManyInversed(Post, 'tags')
}
