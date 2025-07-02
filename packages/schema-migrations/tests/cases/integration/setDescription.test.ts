import { testMigrations } from '../../src/tests.js'
import { SQL } from '../../src/tags.js'
import { createSchema, c } from '@contember/schema-definition'
import { describe } from 'bun:test'

namespace SetDescriptionOnEntityOriginalSchema {
	export class Author {
		name = c.stringColumn()
	}
}

namespace SetDescriptionOnEntityUpdatedSchema {
	@c.Description('Author entity represents a person who writes articles')
	export class Author {
		name = c.stringColumn()
	}
}

describe('set description on entity', () => testMigrations({
	original: createSchema(SetDescriptionOnEntityOriginalSchema),
	updated: createSchema(SetDescriptionOnEntityUpdatedSchema),
	diff: [
		{
			modification: 'setDescription',
			entityName: 'Author',
			description: 'Author entity represents a person who writes articles',
		},
	],
	sql: SQL``,
}))

namespace SetDescriptionOnFieldOriginalSchema {
	export class Author {
		name = c.stringColumn()
	}
}

namespace SetDescriptionOnFieldUpdatedSchema {
	export class Author {
		name = c.stringColumn().description('Full name of the author')
	}
}

describe('set description on field', () => testMigrations({
	original: createSchema(SetDescriptionOnFieldOriginalSchema),
	updated: createSchema(SetDescriptionOnFieldUpdatedSchema),
	diff: [
		{
			modification: 'setDescription',
			entityName: 'Author',
			fieldName: 'name',
			description: 'Full name of the author',
		},
	],
	sql: SQL``,
}))

namespace UpdateEntityDescriptionOriginalSchema {
	@c.Description('Old description')
	export class Author {
		name = c.stringColumn()
	}
}

namespace UpdateEntityDescriptionUpdatedSchema {
	@c.Description('New updated description')
	export class Author {
		name = c.stringColumn()
	}
}

describe('update existing entity description', () => testMigrations({
	original: createSchema(UpdateEntityDescriptionOriginalSchema),
	updated: createSchema(UpdateEntityDescriptionUpdatedSchema),
	diff: [
		{
			modification: 'setDescription',
			entityName: 'Author',
			description: 'New updated description',
		},
	],
	sql: SQL``,
}))

namespace UpdateFieldDescriptionOriginalSchema {
	export class Author {
		name = c.stringColumn().description('Old field description')
	}
}

namespace UpdateFieldDescriptionUpdatedSchema {
	export class Author {
		name = c.stringColumn().description('New field description')
	}
}

describe('update existing field description', () => testMigrations({
	original: createSchema(UpdateFieldDescriptionOriginalSchema),
	updated: createSchema(UpdateFieldDescriptionUpdatedSchema),
	diff: [
		{
			modification: 'setDescription',
			entityName: 'Author',
			fieldName: 'name',
			description: 'New field description',
		},
	],
	sql: SQL``,
}))

namespace RemoveEntityDescriptionOriginalSchema {
	@c.Description('Author description to be removed')
	export class Author {
		name = c.stringColumn()
	}
}

namespace RemoveEntityDescriptionUpdatedSchema {
	export class Author {
		name = c.stringColumn()
	}
}

describe('remove entity description', () => testMigrations({
	original: createSchema(RemoveEntityDescriptionOriginalSchema),
	updated: createSchema(RemoveEntityDescriptionUpdatedSchema),
	diff: [
		{
			modification: 'setDescription',
			entityName: 'Author',
			description: undefined,
		},
	],
	sql: SQL``,
}))

namespace RemoveFieldDescriptionOriginalSchema {
	export class Author {
		name = c.stringColumn().description('Field description to be removed')
	}
}

namespace RemoveFieldDescriptionUpdatedSchema {
	export class Author {
		name = c.stringColumn()
	}
}

describe('remove field description', () => testMigrations({
	original: createSchema(RemoveFieldDescriptionOriginalSchema),
	updated: createSchema(RemoveFieldDescriptionUpdatedSchema),
	diff: [
		{
			modification: 'setDescription',
			entityName: 'Author',
			fieldName: 'name',
			description: undefined,
		},
	],
	sql: SQL``,
}))

namespace SetDescriptionOnRelationOriginalSchema {
	export class Author {
		name = c.stringColumn()
		posts = c.oneHasMany(Post, 'author')
	}

	export class Post {
		title = c.stringColumn()
		author = c.manyHasOne(Author, 'posts')
	}
}

namespace SetDescriptionOnRelationUpdatedSchema {
	export class Author {
		name = c.stringColumn()
		posts = c.oneHasMany(Post, 'author').description('All posts written by this author')
	}

	export class Post {
		title = c.stringColumn()
		author = c.manyHasOne(Author, 'posts').description('The author who wrote this post')
	}
}

describe('set description on relation field', () => testMigrations({
	original: createSchema(SetDescriptionOnRelationOriginalSchema),
	updated: createSchema(SetDescriptionOnRelationUpdatedSchema),
	diff: [
		{
			modification: 'setDescription',
			entityName: 'Author',
			fieldName: 'posts',
			description: 'All posts written by this author',
		},
		{
			modification: 'setDescription',
			entityName: 'Post',
			fieldName: 'author',
			description: 'The author who wrote this post',
		},
	],
	sql: SQL``,
}))

namespace MultipleDescriptionsOriginalSchema {
	export class Author {
		name = c.stringColumn()
		email = c.stringColumn()
	}

	export class Post {
		title = c.stringColumn()
		content = c.stringColumn()
	}
}

namespace MultipleDescriptionsUpdatedSchema {
	@c.Description('Represents content authors')
	export class Author {
		name = c.stringColumn().description('Author full name')
		email = c.stringColumn().description('Contact email address')
	}

	@c.Description('Blog post content')
	export class Post {
		title = c.stringColumn().description('Post title')
		content = c.stringColumn().description('Main post content')
	}
}

describe('set description on multiple entities and fields', () => testMigrations({
	original: createSchema(MultipleDescriptionsOriginalSchema),
	updated: createSchema(MultipleDescriptionsUpdatedSchema),
	diff: [
		{
			modification: 'setDescription',
			entityName: 'Author',
			description: 'Represents content authors',
		},
		{
			modification: 'setDescription',
			entityName: 'Author',
			fieldName: 'name',
			description: 'Author full name',
		},
		{
			modification: 'setDescription',
			entityName: 'Author',
			fieldName: 'email',
			description: 'Contact email address',
		},
		{
			modification: 'setDescription',
			entityName: 'Post',
			description: 'Blog post content',
		},
		{
			modification: 'setDescription',
			entityName: 'Post',
			fieldName: 'title',
			description: 'Post title',
		},
		{
			modification: 'setDescription',
			entityName: 'Post',
			fieldName: 'content',
			description: 'Main post content',
		},
	],
	sql: SQL``,
}))

namespace NoChangesOriginalSchema {
	@c.Description('Same description')
	export class Author {
		name = c.stringColumn().description('Same field description')
	}
}

namespace NoChangesUpdatedSchema {
	@c.Description('Same description')
	export class Author {
		name = c.stringColumn().description('Same field description')
	}
}

describe('no changes when descriptions are the same', () => testMigrations({
	original: createSchema(NoChangesOriginalSchema),
	updated: createSchema(NoChangesUpdatedSchema),
	diff: [],
	sql: SQL``,
}))
