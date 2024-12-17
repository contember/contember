import { testMigrations } from '../../src/tests'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags'
import { createDatabaseMetadata } from '@contember/database'
import { describe } from 'bun:test'

describe('convert one has one to many has one relation', () => {
	testMigrations({
		original: {
			model: new SchemaBuilder()
				.entity('Post', entity =>
					entity.oneHasOne('image', rel => rel.target('Image')),
				)
				.entity('Image', e => e.column('url', c => c.type(Model.ColumnType.String)))
				.buildSchema(),
		},
		updated: {
			model: new SchemaBuilder()
				.entity('Post', entity =>
					entity.manyHasOne('image', rel => rel.target('Image')),
				)
				.entity('Image', e => e.column('url', c => c.type(Model.ColumnType.String)))
				.buildSchema(),
		},
		diff: [
			{
				modification: 'convertOneToManyRelation',
				entityName: 'Post',
				fieldName: 'image',
			},
		],
		sql: SQL`
            CREATE INDEX ON "post" ("image_id");
            ALTER TABLE "post"
                DROP CONSTRAINT "uniq_post_image_id";
		`,
		databaseMetadata: createDatabaseMetadata({
			foreignKeys: [],
			indexes: [],
			uniqueConstraints: [{
				constraintName: 'uniq_post_image_id',
				columnNames: ['image_id'],
				tableName: 'post',
				deferred: false,
				deferrable: false,
			}],
		}),
	})
})


describe('convert one has one to many has one relation with inverse side', () => testMigrations({
	original: {
		model: new SchemaBuilder()
			.entity('Post', entity =>
				entity.oneHasOne('image', rel => rel.target('Image').inversedBy('post')),
			)
			.entity('Image', e => e.column('url', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
	},
	updated: {
		model: new SchemaBuilder()
			.entity('Post', entity =>
				entity.manyHasOne('image', rel => rel.target('Image').inversedBy('posts')),
			)
			.entity('Image', e => e.column('url', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
	},
	diff: [
		{
			modification: 'convertOneToManyRelation',
			entityName: 'Post',
			fieldName: 'image',
			newInverseSideFieldName: 'posts',
		},
	],
	sql: SQL`
	CREATE INDEX ON "post" ("image_id"); 
	ALTER TABLE "post" DROP CONSTRAINT "uniq_post_image_id";
`,
	databaseMetadata: createDatabaseMetadata({
		foreignKeys: [],
		indexes: [],
		uniqueConstraints: [{
			constraintName: 'uniq_post_image_id',
			columnNames: ['image_id'],
			tableName: 'post',
			deferred: false,
			deferrable: false,
		}],
	}),
}))

describe('convert one has one to many has one relation with inverse side, but not renamed', () => testMigrations({
	original: {
		model: new SchemaBuilder()
			.entity('Post', entity =>
				entity.oneHasOne('image', rel => rel.target('Image').inversedBy('posts')),
			)
			.entity('Image', e => e.column('url', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
	},
	updated: {
		model: new SchemaBuilder()
			.entity('Post', entity =>
				entity.manyHasOne('image', rel => rel.target('Image').inversedBy('posts')),
			)
			.entity('Image', e => e.column('url', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
	},
	diff: [
		{
			modification: 'convertOneToManyRelation',
			entityName: 'Post',
			fieldName: 'image',
		},
	],
	sql: SQL`
        CREATE INDEX ON "post" ("image_id");
        ALTER TABLE "post"
            DROP CONSTRAINT "uniq_post_image_id";
	`,
	databaseMetadata: createDatabaseMetadata({
		foreignKeys: [],
		indexes: [],
		uniqueConstraints: [{
			constraintName: 'uniq_post_image_id',
			columnNames: ['image_id'],
			tableName: 'post',
			deferred: false,
			deferrable: false,
		}],
	}),
}))

