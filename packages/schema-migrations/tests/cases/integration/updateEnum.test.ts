import { describe } from 'bun:test'
import { testMigrations } from '../../src/tests'
import { c, createSchema, SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags'

describe('update enum', () => testMigrations({
	original: {
		model: new SchemaBuilder()
			.entity('Post', e =>
				e
					.column('title', c => c.type(Model.ColumnType.String))
					.column('status', c => c.type(Model.ColumnType.Enum, { enumName: 'postStatus' })),
			)
			.enum('postStatus', ['publish', 'draft', 'autodraft'])
			.buildSchema(),
	},
	updated: {
		model: new SchemaBuilder()
			.entity('Post', e =>
				e
					.column('title', c => c.type(Model.ColumnType.String))
					.column('status', c => c.type(Model.ColumnType.Enum, { enumName: 'postStatus' })),
			)
			.enum('postStatus', ['publish', 'draft'])
			.buildSchema(),
	},
	diff: [
		{
			modification: 'updateEnum',
			enumName: 'postStatus',
			values: ['publish', 'draft'],
		},
	],
	sql: SQL`ALTER DOMAIN "postStatus" DROP CONSTRAINT poststatus_check;
	ALTER DOMAIN "postStatus" ADD CONSTRAINT poststatus_check CHECK (VALUE IN('publish','draft'));`,
}))


namespace EnumModelOriginal {
	export const FooStatus = c.createEnum('foo', 'bar')
	export class Foo {

		status = c.enumColumn(FooStatus).notNull()
		statusList = c.enumColumn(FooStatus).notNull().list()
	}
}

namespace EnumModelUpdated {
	export const FooStatus = c.createEnum('foo', 'bar', 'baz')

	export class Foo {

		status = c.enumColumn(FooStatus).notNull()
		statusList = c.enumColumn(FooStatus).notNull().list()
	}
}


describe('update enum if used in list', () => testMigrations({
	original: {
		model: createSchema(EnumModelOriginal).model,
	},
	updated: {
		model: createSchema(EnumModelUpdated).model,
	},
	diff: [
		{
			modification: 'updateEnum',
			enumName: 'FooStatus',
			values: ['foo', 'bar', 'baz'],
		},
	],
	sql: SQL`ALTER DOMAIN "FooStatus" RENAME TO "FooStatus__old"; 
CREATE DOMAIN "FooStatus" AS text CONSTRAINT "foostatus_check" CHECK (VALUE IN('foo','bar','baz')); 
ALTER TABLE "foo" ALTER "status" SET DATA TYPE "FooStatus"; 
ALTER TABLE "foo" ALTER "status_list" SET DATA TYPE "FooStatus"[]; 
DROP DOMAIN "FooStatus__old";`,
}))
