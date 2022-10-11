import { Model, Schema } from '@contember/schema'
import { createMock } from './utils'
import {
	Migration,
	MigrationsResolver,
	ModificationHandlerFactory,
	SchemaDiffer,
	SchemaMigrator,
	VERSION_LATEST,
} from '@contember/schema-migrations'
import { emptySchema, Providers } from '@contember/schema-utils'
import { ApiTester } from './ApiTester'
import { SelectBuilder } from '@contember/database'
import { assert } from 'vitest'
import { MapperContainerFactory } from '@contember/engine-content-api'

type Test = {
	schema: Partial<Schema>
	seed: {
		query: string
		queryVariables?: Record<string, any>
	}[]
	query: string
	queryVariables?: Record<string, any>
	expectDatabase?: Record<string, Record<string, any>[]>
	mapperContainerFactoryFactory?: (providers: Providers) => MapperContainerFactory
} & ({ return: object | ((response: any) => void) } | { throws: { message: string } })

export const executeDbTest = async (test: Test) => {
	const modificationFactory = new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)
	const schemaMigrator = new SchemaMigrator(modificationFactory)
	const schemaDiffer = new SchemaDiffer(schemaMigrator)
	const modifications = schemaDiffer.diffSchemas(emptySchema, {
		...emptySchema,
		...test.schema,
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
		mapperContainerFactoryFactory: test.mapperContainerFactoryFactory,
	})
	try {
		await tester.stages.createAll()
		await tester.stages.migrate('2019-01-01-100000')
		for (const { query, queryVariables } of test.seed) {
			await tester.content.queryContent('prod', query, queryVariables)
		}
		try {
			const response = await tester.content.queryContent('prod', test.query, test.queryVariables)
			if ('return' in test) {
				if (typeof test.return === 'function') {
					test.return(response)
				} else {
					assert.deepStrictEqual(response, test.return)
				}
			}
		} catch (e) {
			if ('throws' in test && e instanceof Error) {
				assert.equal(e.message, test.throws.message)
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
		assert.deepStrictEqual(dbData, test.expectDatabase ?? {})
	} finally {
		await tester.cleanup()
	}
}
