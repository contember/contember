import { Migration, ModificationHandlerFactory, SchemaDiffer, SchemaMigrator, VERSION_LATEST } from '../../src'
import { Schema } from '@contember/schema'
import { createMigrationBuilder } from '@contember/database-migrations'
import { expect, describe, it, test } from 'bun:test'
import { emptySchema } from '@contember/schema-utils'
import { DatabaseMetadata, emptyDatabaseMetadata } from '@contember/database'

const modificationFactory = new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)
const schemaMigrator = new SchemaMigrator(modificationFactory)
const schemaDiffer = new SchemaDiffer(schemaMigrator)

export interface TestContext {
	diff: Migration.Modification[]
	original: Partial<Schema>
	updated: Partial<Schema>
	sql: string
	noDiff?: boolean
	databaseMetadata?: DatabaseMetadata
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
		expect(actualDiff).toStrictEqual(expectedDiff)
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
	expect(schema).toStrictEqual({
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

	expect(actualSchema).toStrictEqual({
		...emptySchema,
		...expected,
	})
}

export function testGenerateSql(
	original: Partial<Schema>,
	diff: Migration.Modification[],
	expectedSql: string,
	databaseMetadata: DatabaseMetadata = emptyDatabaseMetadata,
) {
	let schema = { ...emptySchema, ...original }
	const builder = createMigrationBuilder()
	for (let { modification, ...data } of diff) {
		const modificationHandler = modificationFactory.create(modification, data, schema, {
			formatVersion: VERSION_LATEST,
		})
		modificationHandler.createSql(builder, {
			systemSchema: 'system',
			databaseMetadata,
			invalidateDatabaseMetadata: () => null,
		})
		schema = modificationHandler.getSchemaUpdater()({ schema })
	}
	const actual = builder.getSql().replace(/\s+/g, ' ').trim()
	expect(actual).toEqual(expectedSql)
}

export function testMigrations({ original, updated, diff, noDiff, sql, databaseMetadata }: TestContext) {
	test('diff schemas', () => {
		if (noDiff) {
			return
		}
		testDiffSchemas(original, updated, diff)
	})
	test('apply diff', () => {
		testApplyDiff(original, updated, diff)
	})
	test('generate sql', () => {
		testGenerateSql(original, diff, sql, databaseMetadata)
	})
}
