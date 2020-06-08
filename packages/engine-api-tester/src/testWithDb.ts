import 'jasmine'
import { Model } from '@contember/schema'
import { createMock } from './utils'
import {
	Migration,
	MigrationsResolver,
	ModificationHandlerFactory,
	SchemaDiffer,
	SchemaMigrator,
	VERSION_LATEST,
} from '@contember/schema-migrations'
import { emptySchema } from '@contember/schema-utils'
import { ApiTester } from './ApiTester'
import { SelectBuilder } from '@contember/database'

type Test = {
	schema: Model.Schema
	seed: {
		query: string
		queryVariables?: Record<string, any>
	}[]
	query: string
	queryVariables?: Record<string, any>
	expectDatabase?: Record<string, Record<string, any>[]>
} & ({ return: object } | { throws: { message: string } })

export const executeDbTest = async (test: Test) => {
	const modificationFactory = new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)
	const schemaMigrator = new SchemaMigrator(modificationFactory)
	const schemaDiffer = new SchemaDiffer(schemaMigrator)
	const modifications = schemaDiffer.diffSchemas(emptySchema, {
		model: test.schema,
		acl: { roles: {} },
		validation: {},
	})

	const migrationsResolver = createMock<MigrationsResolver>({
		get directory(): string {
			return ApiTester.getMigrationsDir()
		},
		getMigrations(): Promise<Migration[]> {
			return Promise.resolve([
				{ version: '2019-01-01-100000', name: '2019-01-01-100000-init', formatVersion: VERSION_LATEST, modifications },
			])
		},
	})

	const tester = await ApiTester.create({
		migrationsResolver,
		project: {
			stages: [
				{
					name: 'Prod',
					slug: 'prod',
				},
			],
		},
	})
	await tester.stages.createAll()
	await tester.stages.migrate('2019-01-01-100000')
	for (const { query, queryVariables } of test.seed) {
		await tester.content.queryContent('prod', query, queryVariables)
	}
	try {
		const response = await tester.content.queryContent('prod', test.query, test.queryVariables)
		if ('return' in test) {
			expect(response).toEqual(test.return)
		}
	} catch (e) {
		if ('throws' in test) {
			expect(e.message).toBe(test.throws.message)
		} else {
			throw e
		}
	}

	const dbData: Record<string, Record<string, any>[]> = {}
	for (const table of Object.keys(test.expectDatabase || {})) {
		const qb = SelectBuilder.create().from(table)

		const columns = Object.keys((test.expectDatabase || {})[table][0] || { id: null })
		const qbWithSelect = columns.reduce<SelectBuilder<Record<string, any>>>((qb, column) => qb.select(column), qb)
		dbData[table] = await qbWithSelect.getResult(tester.client.forSchema('stage_prod'))
	}
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	expect(dbData).toEqual(test.expectDatabase!)
	await tester.cleanup()
}
