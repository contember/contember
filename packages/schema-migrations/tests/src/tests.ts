import { Migration, ModificationHandlerFactory, SchemaDiffer, SchemaMigrator, VERSION_LATEST } from '../../src'
import { Schema } from '@contember/schema'
import { createMigrationBuilder } from '@contember/database-migrations'
import { assert, describe, it } from 'vitest'
import { dummySchemaDatabaseMetadata, emptySchema } from '@contember/schema-utils'

const modificationFactory = new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)
const schemaMigrator = new SchemaMigrator(modificationFactory)
const schemaDiffer = new SchemaDiffer(schemaMigrator)

export interface TestContext {
	diff: Migration.Modification[]
	original: Partial<Schema>
	updated: Partial<Schema>
	sql: string
	noDiff?: boolean
}

export function testDiffSchemas(
	original: Partial<Schema>,
	updated: Partial<Schema>,
	expectedDiff: Migration.Modification[],
) {
	const actualDiff = schemaDiffer.diffSchemas(
		{ ...emptySchema, ...original },
		{ ...emptySchema, ...updated },
		{ skipRecreateValidation: true },
	)
	try {
		assert.deepStrictEqual(actualDiff, expectedDiff)
	} catch (e) {
		// eslint-disable-next-line no-console
		console.log(JSON.stringify(actualDiff))
		throw e
	}
	const schema = schemaMigrator.applyModifications(
		{ ...emptySchema, ...original },
		actualDiff,
		VERSION_LATEST,
	)
	assert.deepStrictEqual(schema, {
		...emptySchema,
		...updated,
	})
}

export function testApplyDiff(
	original: Partial<Schema>,
	expected: Partial<Schema>,
	diff: Migration.Modification[],
) {
	const actualSchema = schemaMigrator.applyModifications(
		{ ...emptySchema, ...original },
		diff,
		VERSION_LATEST,
	)

	assert.deepStrictEqual(actualSchema, {
		...emptySchema,
		...expected,
	})
}

export function testGenerateSql(original: Partial<Schema>, diff: Migration.Modification[], expectedSql: string) {
	let schema = { ...emptySchema, ...original }
	const builder = createMigrationBuilder()
	for (let { modification, ...data } of diff) {
		const modificationHandler = modificationFactory.create(modification, data, schema, {
			formatVersion: VERSION_LATEST,
		})
		modificationHandler.createSql(builder, {
			systemSchema: 'system',
			databaseMetadata: dummySchemaDatabaseMetadata,
			invalidateDatabaseMetadata: () => null,
		})
		schema = modificationHandler.getSchemaUpdater()({ schema })
	}
	const actual = builder.getSql().replace(/\s+/g, ' ').trim()
	assert.equal(actual, expectedSql)
}

export function testMigrations(title: string, { original, updated, diff, noDiff, sql }: TestContext) {
	describe(title, () => {
		it('diff schemas', () => {
			if (noDiff) {
				return
			}
			testDiffSchemas(original, updated, diff)
		})
		it('apply diff', () => {
			testApplyDiff(original, updated, diff)
		})
		it('generate sql', () => {
			testGenerateSql(original, diff, sql)
		})
	})
}
