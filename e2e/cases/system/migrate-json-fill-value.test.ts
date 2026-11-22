import { expect, test } from 'bun:test'
import { createTester } from '../../src/tester.js'
import { c, createSchema } from '@contember/schema-definition'
import { ModificationHandlerFactory, SchemaDiffer, SchemaMigrator } from '@contember/schema-migrations'

namespace LogModelOriginal {
	export class Log {
		message = c.stringColumn()
	}
}

namespace LogModelUpdate {
	export class Log {
		message = c.stringColumn()
		meta = c.jsonColumn().notNull().default({})
	}
}

const differ = new SchemaDiffer(new SchemaMigrator(new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)))

test('a non-null json column with an object default is added to a table with rows', async () => {
	const origSchema = createSchema(LogModelOriginal)
	const tester = await createTester(origSchema)

	await tester(`mutation {
		createLog(data: {message: "existing"}) {
			ok
		}
	}`)
		.expect(200)
		.expect(response => {
			expect(response.body.data.createLog.ok).toBe(true)
		})

	const migration = differ.diffSchemas(origSchema, createSchema(LogModelUpdate))
	await tester.migrate(migration, '2026-11-22-120000-add-log-meta')

	await tester(`query {
		listLog {
			message
			meta
		}
	}`)
		.expect(200)
		.expect(response => {
			expect(response.body.data.listLog).toStrictEqual([{ message: 'existing', meta: {} }])
		})
})
