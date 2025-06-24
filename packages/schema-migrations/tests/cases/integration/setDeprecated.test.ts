import { testMigrations } from '../../src/tests.js'
import { SQL } from '../../src/tags.js'
import { createSchema, c } from '@contember/schema-definition'
import { describe } from 'bun:test'

namespace SetDeprecatedOnEntityOriginalSchema {
	export class Author {
		name = c.stringColumn()
	}
}

namespace SetDeprecatedOnEntityUpdatedSchema {
	@c.Deprecated('This entity is deprecated, use User instead')
	export class Author {
		name = c.stringColumn()
	}
}

describe('set deprecation on entity', () => testMigrations({
	original: createSchema(SetDeprecatedOnEntityOriginalSchema),
	updated: createSchema(SetDeprecatedOnEntityUpdatedSchema),
	diff: [
		{
			modification: 'setDeprecationMessage',
			entityName: 'Author',
			deprecationReason: 'This entity is deprecated, use User instead',
		},
	],
	sql: SQL``,
}))

namespace SetDeprecatedOnFieldOriginalSchema {
	export class Author {
		name = c.stringColumn()
	}
}

namespace SetDeprecatedOnFieldUpdatedSchema {
	export class Author {
		name = c.stringColumn().deprecated('Use fullName field instead')
	}
}

describe('set deprecation on field', () => testMigrations({
	original: createSchema(SetDeprecatedOnFieldOriginalSchema),
	updated: createSchema(SetDeprecatedOnFieldUpdatedSchema),
	diff: [
		{
			modification: 'setDeprecationMessage',
			entityName: 'Author',
			fieldName: 'name',
			deprecationReason: 'Use fullName field instead',
		},
	],
	sql: SQL``,
}))

namespace UpdateEntityDeprecationOriginalSchema {
	@c.Deprecated('Old deprecation message')
	export class Author {
		name = c.stringColumn()
	}
}

namespace UpdateEntityDeprecationUpdatedSchema {
	@c.Deprecated('New updated deprecation message')
	export class Author {
		name = c.stringColumn()
	}
}

describe('update existing entity deprecation', () => testMigrations({
	original: createSchema(UpdateEntityDeprecationOriginalSchema),
	updated: createSchema(UpdateEntityDeprecationUpdatedSchema),
	diff: [
		{
			modification: 'setDeprecationMessage',
			entityName: 'Author',
			deprecationReason: 'New updated deprecation message',
		},
	],
	sql: SQL``,
}))

namespace UpdateFieldDeprecationOriginalSchema {
	export class Author {
		name = c.stringColumn().deprecated('Old field deprecation')
	}
}

namespace UpdateFieldDeprecationUpdatedSchema {
	export class Author {
		name = c.stringColumn().deprecated('New field deprecation')
	}
}

describe('update existing field deprecation', () => testMigrations({
	original: createSchema(UpdateFieldDeprecationOriginalSchema),
	updated: createSchema(UpdateFieldDeprecationUpdatedSchema),
	diff: [
		{
			modification: 'setDeprecationMessage',
			entityName: 'Author',
			fieldName: 'name',
			deprecationReason: 'New field deprecation',
		},
	],
	sql: SQL``,
}))

namespace RemoveEntityDeprecationOriginalSchema {
	@c.Deprecated('Entity deprecation to be removed')
	export class Author {
		name = c.stringColumn()
	}
}

namespace RemoveEntityDeprecationUpdatedSchema {
	export class Author {
		name = c.stringColumn()
	}
}

describe('remove entity deprecation', () => testMigrations({
	original: createSchema(RemoveEntityDeprecationOriginalSchema),
	updated: createSchema(RemoveEntityDeprecationUpdatedSchema),
	diff: [
		{
			modification: 'setDeprecationMessage',
			entityName: 'Author',
			deprecationReason: undefined,
		},
	],
	sql: SQL``,
}))

namespace RemoveFieldDeprecationOriginalSchema {
	export class Author {
		name = c.stringColumn().deprecated('Field deprecation to be removed')
	}
}

namespace RemoveFieldDeprecationUpdatedSchema {
	export class Author {
		name = c.stringColumn()
	}
}

describe('remove field deprecation', () => testMigrations({
	original: createSchema(RemoveFieldDeprecationOriginalSchema),
	updated: createSchema(RemoveFieldDeprecationUpdatedSchema),
	diff: [
		{
			modification: 'setDeprecationMessage',
			entityName: 'Author',
			fieldName: 'name',
			deprecationReason: undefined,
		},
	],
	sql: SQL``,
}))

namespace SetDeprecatedOnRelationOriginalSchema {
	export class Author {
		name = c.stringColumn()
		posts = c.oneHasMany(Post, 'author')
	}

	export class Post {
		title = c.stringColumn()
		author = c.manyHasOne(Author, 'posts')
	}
}

namespace SetDeprecatedOnRelationUpdatedSchema {
	export class Author {
		name = c.stringColumn()
		posts = c.oneHasMany(Post, 'author').deprecated('Use articles relation instead')
	}

	export class Post {
		title = c.stringColumn()
		author = c.manyHasOne(Author, 'posts').deprecated('Use writer relation instead')
	}
}

describe('set deprecation on relation field', () => testMigrations({
	original: createSchema(SetDeprecatedOnRelationOriginalSchema),
	updated: createSchema(SetDeprecatedOnRelationUpdatedSchema),
	diff: [
		{
			modification: 'setDeprecationMessage',
			entityName: 'Author',
			fieldName: 'posts',
			deprecationReason: 'Use articles relation instead',
		},
		{
			modification: 'setDeprecationMessage',
			entityName: 'Post',
			fieldName: 'author',
			deprecationReason: 'Use writer relation instead',
		},
	],
	sql: SQL``,
}))

namespace MultipleDeprecationsOriginalSchema {
	export class Author {
		name = c.stringColumn()
		email = c.stringColumn()
	}

	export class Post {
		title = c.stringColumn()
		content = c.stringColumn()
	}
}

namespace MultipleDeprecationsUpdatedSchema {
	@c.Deprecated('Author entity is deprecated')
	export class Author {
		name = c.stringColumn().deprecated('Use displayName instead')
		email = c.stringColumn().deprecated('Use contactEmail instead')
	}

	@c.Deprecated('Post entity is deprecated')
	export class Post {
		title = c.stringColumn().deprecated('Use headline instead')
		content = c.stringColumn().deprecated('Use body instead')
	}
}

describe('set deprecation on multiple entities and fields', () => testMigrations({
	original: createSchema(MultipleDeprecationsOriginalSchema),
	updated: createSchema(MultipleDeprecationsUpdatedSchema),
	diff: [
		{
			modification: 'setDeprecationMessage',
			entityName: 'Author',
			deprecationReason: 'Author entity is deprecated',
		},
		{
			modification: 'setDeprecationMessage',
			entityName: 'Author',
			fieldName: 'name',
			deprecationReason: 'Use displayName instead',
		},
		{
			modification: 'setDeprecationMessage',
			entityName: 'Author',
			fieldName: 'email',
			deprecationReason: 'Use contactEmail instead',
		},
		{
			modification: 'setDeprecationMessage',
			entityName: 'Post',
			deprecationReason: 'Post entity is deprecated',
		},
		{
			modification: 'setDeprecationMessage',
			entityName: 'Post',
			fieldName: 'title',
			deprecationReason: 'Use headline instead',
		},
		{
			modification: 'setDeprecationMessage',
			entityName: 'Post',
			fieldName: 'content',
			deprecationReason: 'Use body instead',
		},
	],
	sql: SQL``,
}))



namespace NoChangesDeprecationOriginalSchema {
	@c.Deprecated('Same deprecation message')
	export class Author {
		name = c.stringColumn().deprecated('Same field deprecation')
	}
}

namespace NoChangesDeprecationUpdatedSchema {
	@c.Deprecated('Same deprecation message')
	export class Author {
		name = c.stringColumn().deprecated('Same field deprecation')
	}
}

describe('no changes when deprecations are the same', () => testMigrations({
	original: createSchema(NoChangesDeprecationOriginalSchema),
	updated: createSchema(NoChangesDeprecationUpdatedSchema),
	diff: [],
	sql: SQL``,
}))
