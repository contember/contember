import { Migration, ModificationHandlerFactory, SchemaDiffer, SchemaMigrator, VERSION_LATEST } from '../../src'
import { Acl, Model } from '@contember/schema'
import { createMigrationBuilder } from '@contember/database-migrations'
import { assert, describe, it } from 'vitest'
import { SchemaWithMeta } from '../../src/modifications/utils/schemaMeta'
import { emptySchema } from '@contember/schema-utils'

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
		false,
	)
	assert.deepStrictEqual(actualDiff, expectedDiff)
	const { meta, ...schema } = schemaMigrator.applyModifications(
		{ ...emptySchema, model: originalModel, acl: originalAcl },
		actualDiff,
		VERSION_LATEST,
	) as SchemaWithMeta
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
	const { meta, ...actualSchema } = schemaMigrator.applyModifications(
		{ ...emptySchema, model: originalModel, acl: originalAcl },
		diff,
		VERSION_LATEST,
	) as SchemaWithMeta

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
		const modificationHandler = modificationFactory.create(modification, data, schema, { formatVersion: VERSION_LATEST, systemSchema: 'system' })
		modificationHandler.createSql(builder)
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
