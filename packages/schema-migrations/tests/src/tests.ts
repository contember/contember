import { DiffOptions, Migration, ModificationHandlerFactory, SchemaDiffer, SchemaMigrator, VERSION_LATEST } from '../../src/index.js'
import { Schema } from '@contember/schema'
import { createMigrationBuilder } from '@contember/database-migrations'
import { describe, expect, it, test } from 'bun:test'
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
	diffOptions?: DiffOptions
}

export function testDiffSchemas(
	original: Partial<Schema>,
	updated: Partial<Schema>,
	expectedDiff: Migration.Modification[],
	diffOptions: DiffOptions = {},
) {
	const actualDiff = schemaDiffer.diffSchemas(
		{ ...emptySchema, ...original },
		{ ...emptySchema, ...updated },
		{ skipRecreateValidation: true, ...diffOptions },
	)
	try {
		expect(actualDiff).toStrictEqual(expectedDiff)
	} catch (e) {
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

export function testMigrations({ original, updated, diff, noDiff, sql, databaseMetadata, diffOptions }: TestContext) {
	test('diff schemas', () => {
		if (noDiff) {
			return
		}
		testDiffSchemas(original, updated, diff, diffOptions)
	})
	test('apply diff', () => {
		testApplyDiff(original, updated, diff)
	})
	test('generate sql', () => {
		testGenerateSql(original, diff, sql, databaseMetadata)
	})
}
