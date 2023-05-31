import { Migration, ModificationHandlerFactory, SchemaDiffer, SchemaMigrator, VERSION_LATEST } from '../../src'
import { Acl, Model } from '@contember/schema'
import { createMigrationBuilder } from '@contember/database-migrations'
import { assert, describe, it } from 'vitest'
import { dummySchemaDatabaseMetadata, emptySchema } from '@contember/schema-utils'

const modificationFactory = new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)
const schemaMigrator = new SchemaMigrator(modificationFactory)
const schemaDiffer = new SchemaDiffer(schemaMigrator)

const emptyAcl = { roles: {} }

export interface TestContext {
	diff: Migration.Modification[]
	originalSchema: Model.Schema
	updatedSchema: Model.Schema
	originalAcl?: Acl.Schema
	updatedAcl?: Acl.Schema
	sql: string
	noDiff?: boolean
}

export function testDiffSchemas(
	originalModel: Model.Schema,
	updatedModel: Model.Schema,
	expectedDiff: Migration.Modification[],
	originalAcl: Acl.Schema = emptyAcl,
	updatedAcl: Acl.Schema = emptyAcl,
) {
	const actualDiff = schemaDiffer.diffSchemas(
		{ ...emptySchema, model: originalModel, acl: originalAcl },
		{ ...emptySchema, model: updatedModel, acl: updatedAcl },
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
		{ ...emptySchema, model: originalModel, acl: originalAcl },
		actualDiff,
		VERSION_LATEST,
	)
	assert.deepStrictEqual(schema, {
		...emptySchema,
		model: updatedModel,
		acl: updatedAcl,
	})
}

export function testApplyDiff(
	originalModel: Model.Schema,
	diff: Migration.Modification[],
	expectedModel: Model.Schema,
	originalAcl: Acl.Schema = emptyAcl,
	expectedAcl: Acl.Schema = emptyAcl,
) {
	const actualSchema = schemaMigrator.applyModifications(
		{ ...emptySchema, model: originalModel, acl: originalAcl },
		diff,
		VERSION_LATEST,
	)

	assert.deepStrictEqual(actualSchema, {
		...emptySchema,
		model: expectedModel,
		acl: expectedAcl,
	})
}

export function testGenerateSql(originalSchema: Model.Schema, diff: Migration.Modification[], expectedSql: string) {
	let schema = { ...emptySchema, model: originalSchema, acl: emptyAcl }
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

export function testMigrations(title: string, { originalSchema, updatedSchema, diff, noDiff, originalAcl, updatedAcl, sql }: TestContext) {
	describe(title, () => {
		it('diff schemas', () => {
			if (noDiff) {
				return
			}
			testDiffSchemas(originalSchema, updatedSchema, diff, originalAcl, updatedAcl)
		})
		it('apply diff', () => {
			testApplyDiff(originalSchema, diff, updatedSchema, originalAcl, updatedAcl)
		})
		it('generate sql', () => {
			testGenerateSql(originalSchema, diff, sql)
		})
	})
}
