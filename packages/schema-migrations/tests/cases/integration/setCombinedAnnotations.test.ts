import { testMigrations } from '../../src/tests.js'
import { SQL } from '../../src/tags.js'
import { createSchema, c } from '@contember/schema-definition'
import { describe } from 'bun:test'
import { DEFAULT_ENTITY_DEPRECATION_REASON, DEFAULT_FIELD_DEPRECATION_REASON } from '@contember/schema-utils'

namespace MixedAnnotationsOriginalSchema {
	export class User {
		username = c.stringColumn()
		email = c.stringColumn()
	}
}

namespace MixedAnnotationsUpdatedSchema {
	@c.Description('User account information')
	@c.Deprecated('Use Account entity instead')
	export class User {
		username = c.stringColumn().deprecated('Use loginName instead').description('Unique username')
		email = c.stringColumn().description('User email address')
	}
}

describe('set both description and deprecation annotations', () => testMigrations({
	original: createSchema(MixedAnnotationsOriginalSchema),
	updated: createSchema(MixedAnnotationsUpdatedSchema),
	diff: [
		{
			description: 'User account information',
			entityName: 'User',
			modification: 'setDescription',
		},
		{
			description: 'Unique username',
			modification: 'setDescription',
			entityName: 'User',
			fieldName: 'username',
		},
		{
			description: 'User email address',
			modification: 'setDescription',
			entityName: 'User',
			fieldName: 'email',
		},
		{
			deprecationReason: 'Use Account entity instead',
			modification: 'setDeprecationMessage',
			entityName: 'User',
		},
		{
			deprecationReason: 'Use loginName instead',
			modification: 'setDeprecationMessage',
			entityName: 'User',
			fieldName: 'username',
		},
	],
	sql: SQL``,
}))

namespace CombinedAnnotationsOnRelationsOriginalSchema {
	export class Author {
		name = c.stringColumn()
		posts = c.oneHasMany(Post, 'author')
	}

	export class Post {
		title = c.stringColumn()
		author = c.manyHasOne(Author, 'posts')
	}
}

namespace CombinedAnnotationsOnRelationsUpdatedSchema {
	export class Author {
		name = c.stringColumn()
		posts = c.oneHasMany(Post, 'author')
			.description('All posts written by this author')
			.deprecated('Use articles relation instead')
	}

	export class Post {
		title = c.stringColumn()
		author = c.manyHasOne(Author, 'posts')
			.description('The author who wrote this post')
			.deprecated('Use writer relation instead')
	}
}

describe('set both description and deprecation on relation fields', () => testMigrations({
	original: createSchema(CombinedAnnotationsOnRelationsOriginalSchema),
	updated: createSchema(CombinedAnnotationsOnRelationsUpdatedSchema),
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

namespace UpdateCombinedAnnotationsOriginalSchema {
	@c.Description('Old entity description')
	@c.Deprecated('Old entity deprecation')
	export class Product {
		name = c.stringColumn()
			.description('Old field description')
			.deprecated('Old field deprecation')
		price = c.stringColumn()
	}
}

namespace UpdateCombinedAnnotationsUpdatedSchema {
	@c.Description('New entity description')
	@c.Deprecated('New entity deprecation')
	export class Product {
		name = c.stringColumn()
			.description('New field description')
			.deprecated('New field deprecation')
		price = c.stringColumn()
			.description('Product price')
			.deprecated('Use cost field instead')
	}
}

describe('update existing combined annotations', () => testMigrations({
	original: createSchema(UpdateCombinedAnnotationsOriginalSchema),
	updated: createSchema(UpdateCombinedAnnotationsUpdatedSchema),
	diff: [
		{
			modification: 'setDescription',
			entityName: 'Product',
			description: 'New entity description',
		},
		{
			modification: 'setDescription',
			entityName: 'Product',
			fieldName: 'name',
			description: 'New field description',
		},
		{
			modification: 'setDescription',
			entityName: 'Product',
			fieldName: 'price',
			description: 'Product price',
		},
		{
			modification: 'setDeprecationMessage',
			entityName: 'Product',
			deprecationReason: 'New entity deprecation',
		},
		{
			modification: 'setDeprecationMessage',
			entityName: 'Product',
			fieldName: 'name',
			deprecationReason: 'New field deprecation',
		},
		{
			modification: 'setDeprecationMessage',
			entityName: 'Product',
			fieldName: 'price',
			deprecationReason: 'Use cost field instead',
		},
	],
	sql: SQL``,
}))

namespace RemoveCombinedAnnotationsOriginalSchema {
	@c.Description('Entity description to remove')
	@c.Deprecated('Entity deprecation to remove')
	export class Category {
		name = c.stringColumn()
			.description('Field description to remove')
			.deprecated('Field deprecation to remove')
	}
}

namespace RemoveCombinedAnnotationsUpdatedSchema {
	export class Category {
		name = c.stringColumn()
	}
}

describe('remove both description and deprecation annotations', () => testMigrations({
	original: createSchema(RemoveCombinedAnnotationsOriginalSchema),
	updated: createSchema(RemoveCombinedAnnotationsUpdatedSchema),
	diff: [
		{
			modification: 'setDescription',
			entityName: 'Category',
			description: undefined,
		},
		{
			modification: 'setDescription',
			entityName: 'Category',
			fieldName: 'name',
			description: undefined,
		},
		{
			modification: 'setDeprecationMessage',
			entityName: 'Category',
			deprecationReason: undefined,
		},
		{
			modification: 'setDeprecationMessage',
			entityName: 'Category',
			fieldName: 'name',
			deprecationReason: undefined,
		},
	],
	sql: SQL``,
}))

namespace DefaultDeprecationMessagesOriginalSchema {
	export class Order {
		id = c.stringColumn()
		items = c.oneHasMany(OrderItem, 'order')
	}

	export class OrderItem {
		name = c.stringColumn()
		order = c.manyHasOne(Order, 'items')
	}
}

namespace DefaultDeprecationMessagesUpdatedSchema {
	@c.Description('Order entity')
	@c.Deprecated()
	export class Order {
		id = c.stringColumn().description('Order identifier')
		items = c.oneHasMany(OrderItem, 'order').deprecated()
	}

	export class OrderItem {
		name = c.stringColumn().deprecated()
		order = c.manyHasOne(Order, 'items')
	}
}

describe('set deprecation with default messages and descriptions', () => testMigrations({
	original: createSchema(DefaultDeprecationMessagesOriginalSchema),
	updated: createSchema(DefaultDeprecationMessagesUpdatedSchema),
	diff: [
		{
			modification: 'setDescription',
			entityName: 'Order',
			description: 'Order entity',
		},
		{
			modification: 'setDescription',
			entityName: 'Order',
			fieldName: 'id',
			description: 'Order identifier',
		},
		{
			modification: 'setDeprecationMessage',
			entityName: 'Order',
			deprecationReason: DEFAULT_ENTITY_DEPRECATION_REASON,
		},
		{
			modification: 'setDeprecationMessage',
			entityName: 'Order',
			fieldName: 'items',
			deprecationReason: DEFAULT_FIELD_DEPRECATION_REASON,
		},
		{
			modification: 'setDeprecationMessage',
			entityName: 'OrderItem',
			fieldName: 'name',
			deprecationReason: DEFAULT_FIELD_DEPRECATION_REASON,
		},
	],
	sql: SQL``,
}))

namespace MixedDefaultAndCustomDeprecationOriginalSchema {
	export class Customer {
		name = c.stringColumn()
		email = c.stringColumn()
		phone = c.stringColumn()
	}
}

namespace MixedDefaultAndCustomDeprecationUpdatedSchema {
	@c.Description('Customer information')
	@c.Deprecated()
	export class Customer {
		name = c.stringColumn()
			.description('Customer name')
			.deprecated('Use fullName instead')
		email = c.stringColumn()
			.description('Customer email')
			.deprecated()
		phone = c.stringColumn()
			.deprecated()
	}
}

describe('mix default and custom deprecation messages with descriptions', () => testMigrations({
	original: createSchema(MixedDefaultAndCustomDeprecationOriginalSchema),
	updated: createSchema(MixedDefaultAndCustomDeprecationUpdatedSchema),
	diff: [
		{
			modification: 'setDescription',
			entityName: 'Customer',
			description: 'Customer information',
		},
		{
			modification: 'setDescription',
			entityName: 'Customer',
			fieldName: 'name',
			description: 'Customer name',
		},
		{
			modification: 'setDescription',
			entityName: 'Customer',
			fieldName: 'email',
			description: 'Customer email',
		},
		{
			modification: 'setDeprecationMessage',
			entityName: 'Customer',
			deprecationReason: DEFAULT_ENTITY_DEPRECATION_REASON,
		},
		{
			modification: 'setDeprecationMessage',
			entityName: 'Customer',
			fieldName: 'name',
			deprecationReason: 'Use fullName instead',
		},
		{
			modification: 'setDeprecationMessage',
			entityName: 'Customer',
			fieldName: 'email',
			deprecationReason: DEFAULT_FIELD_DEPRECATION_REASON,
		},
		{
			modification: 'setDeprecationMessage',
			entityName: 'Customer',
			fieldName: 'phone',
			deprecationReason: DEFAULT_FIELD_DEPRECATION_REASON,
		},
	],
	sql: SQL``,
}))


namespace PartialCombinedAnnotationsOriginalSchema {
	@c.Description('Entity has description only')
	export class Tag {
		name = c.stringColumn().deprecated('Field has deprecation only')
	}
}

namespace PartialCombinedAnnotationsUpdatedSchema {
	@c.Description('Entity has description only')
	@c.Deprecated('Now entity also has deprecation')
	export class Tag {
		name = c.stringColumn()
			.description('Now field also has description')
			.deprecated('Field has deprecation only')
	}
}

describe('add missing annotations to partially annotated entities', () => testMigrations({
	original: createSchema(PartialCombinedAnnotationsOriginalSchema),
	updated: createSchema(PartialCombinedAnnotationsUpdatedSchema),
	diff: [
		{
			modification: 'setDescription',
			entityName: 'Tag',
			fieldName: 'name',
			description: 'Now field also has description',
		},
		{
			modification: 'setDeprecationMessage',
			entityName: 'Tag',
			deprecationReason: 'Now entity also has deprecation',
		},
	],
	sql: SQL``,
}))
