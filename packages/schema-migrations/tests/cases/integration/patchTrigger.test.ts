import { Actions } from '@contember/schema'
import { emptySchema } from '@contember/schema-utils'
import { describe } from 'bun:test'
import { testMigrations } from '../../src/tests'
import { c, createSchema } from '@contember/schema-definition'
namespace Schema {
	export class Post {
		title = c.stringColumn()
		description = c.stringColumn()
		category = c.manyHasOne(Category, 'articles')
	}

	export class Category {
		name = c.stringColumn()
		slug = c.stringColumn()
		articles = c.oneHasMany(Post, 'category')
	}


}

describe('patch trigger', () => testMigrations({
	original: {
		...createSchema(Schema),
		actions: {
			triggers: {
				'post_created': {
					type: 'basic',
					name: 'post_created',
					entity: 'Post',
					create: true,
					delete: false,
					update: false,
					target: 'webhook',
					selection: [
						'id',
						'title',
						['category', {}, ['name']],
					],
				} satisfies Actions.BasicTrigger,
			},
			targets: {
				'webhook': {
					type: 'webhook',
					name: 'webhook',
					url: 'https://example.com/webhook',
				} satisfies Actions.WebhookTarget,
			},
		},
	},
	updated: {
		...createSchema(Schema),
		actions: {
			triggers: {
				'post_created': {
					type: 'basic',
					name: 'post_created',
					entity: 'Post',
					create: true,
					delete: false,
					update: false,
					target: 'webhook',
					selection: [
						'id',
						'title',
						'description', // added field
						['category', {}, ['name', 'slug']], // added sub-field
					],
				} satisfies Actions.BasicTrigger,
			},
			targets: {
				'webhook': {
					type: 'webhook',
					name: 'webhook',
					url: 'https://example.com/webhook',
				} satisfies Actions.WebhookTarget,
			},
		},
	},
	diff: [
		{
			modification: 'patchTrigger',
			triggerName: 'post_created',
			patch: [
				{
					op: 'replace',
					path: '/selection/2',
					value: 'description',
				},
				{
					op: 'add',
					path: '/selection/-',
					value: [
						'category',
						{},
						[
							'name',
							'slug',
						],
					],
				},
			],
		},
	],
	sql: '', // no SQL changes for action modifications
}))

describe('patch watch trigger', () => testMigrations({
	original: {
		...createSchema(Schema),
		actions: {
			triggers: {
				'post_watch': {
					type: 'watch',
					name: 'post_watch',
					entity: 'Post',
					target: 'webhook',
					watch: [
						'title',
						['category', {}, ['name']],
					],
				} satisfies Actions.WatchTrigger,
			},
			targets: {
				'webhook': {
					type: 'webhook',
					name: 'webhook',
					url: 'https://example.com/webhook',
				} satisfies Actions.WebhookTarget,
			},
		},
	},
	updated: {
		...createSchema(Schema),
		actions: {
			triggers: {
				'post_watch': {
					type: 'watch',
					name: 'post_watch',
					entity: 'Post',
					target: 'webhook',
					watch: [
						'title',
						'description', // added field
						['category', {}, ['name', 'slug']], // added sub-field
					],
				} satisfies Actions.WatchTrigger,
			},
			targets: {
				'webhook': {
					type: 'webhook',
					name: 'webhook',
					url: 'https://example.com/webhook',
				} satisfies Actions.WebhookTarget,
			},
		},
	},
	diff: [
		{
			modification: 'patchTrigger',
			triggerName: 'post_watch',
			patch: [
				{
					op: 'replace',
					path: '/watch/1',
					value: 'description',
				},
				{
					op: 'add',
					path: '/watch/-',
					value: [
						'category',
						{},
						[
							'name',
							'slug',
						],
					],
				},
			],
		},
	],
	sql: '', // no SQL changes for action modifications
}))
