import { expect, test } from 'bun:test'
import { createTester, gql } from '../../src/tester.js'
import { c, createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { ModificationHandlerFactory, SchemaDiffer, SchemaMigrator } from '@contember/schema-migrations'
import { Schema } from '@contember/schema'

const diffSchemas = (original: Schema, updated: Schema) => {
	const differ = new SchemaDiffer(new SchemaMigrator(new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)))
	return differ.diffSchemas(original, updated)
}

// Chain of dependent views: ViewC -> ViewB -> ViewA -> source table.
namespace ViewChainV1 {
	export class Source {
		value = c.intColumn()
	}

	@c.View('SELECT id, value FROM source')
	export class ViewA {
		value = def.intColumn()
	}

	@c.View('SELECT id, value FROM view_a', { dependencies: [ViewA] })
	export class ViewB {
		value = def.intColumn()
	}

	@c.View('SELECT id, value FROM view_b', { dependencies: [ViewB] })
	export class ViewC {
		value = def.intColumn()
	}
}

// Only the SQL body of ViewA changes (value * 10); its output columns stay the same.
namespace ViewChainV2InPlace {
	export class Source {
		value = c.intColumn()
	}

	@c.View('SELECT id, value * 10 AS value FROM source')
	export class ViewA {
		value = def.intColumn()
	}

	@c.View('SELECT id, value FROM view_a', { dependencies: [ViewA] })
	export class ViewB {
		value = def.intColumn()
	}

	@c.View('SELECT id, value FROM view_b', { dependencies: [ViewB] })
	export class ViewC {
		value = def.intColumn()
	}
}

// ViewA gains a new output column -> structural change, requires drop & recreate cascade.
namespace ViewChainV2Structural {
	export class Source {
		value = c.intColumn()
	}

	@c.View('SELECT id, value, value * 100 AS big FROM source')
	export class ViewA {
		value = def.intColumn()
		big = def.intColumn()
	}

	@c.View('SELECT id, value FROM view_a', { dependencies: [ViewA] })
	export class ViewB {
		value = def.intColumn()
	}

	@c.View('SELECT id, value FROM view_b', { dependencies: [ViewB] })
	export class ViewC {
		value = def.intColumn()
	}
}

test('Content API: in-place view update (CREATE OR REPLACE) propagates through dependent views', async () => {
	const tester = await createTester(createSchema(ViewChainV1))

	await tester(gql`mutation { createSource(data: { value: 5 }) { ok } }`)
		.expect({ data: { createSource: { ok: true } } })
		.expect(200)

	// before: 5 flows unchanged through the whole chain
	await tester(gql`query { listViewC { value } }`)
		.expect({ data: { listViewC: [{ value: 5 }] } })
		.expect(200)

	// the optimization: an sql-only change must compile to a single updateView, no dependant cascade
	const diff = diffSchemas(createSchema(ViewChainV1), createSchema(ViewChainV2InPlace))
	expect(diff).toHaveLength(1)
	expect(diff[0].modification).toBe('updateView')
	expect((diff[0] as any).entityName).toBe('ViewA')

	await tester.migrate(diff, '2024-07-01-130000-update-view-a')

	// after: ViewA now multiplies by 10; ViewB and ViewC were never recreated yet reflect the new value
	await tester(gql`query { listViewC { value } }`)
		.expect({ data: { listViewC: [{ value: 50 }] } })
		.expect(200)
})

test('Content API: structural view change still cascades drop & recreate', async () => {
	const tester = await createTester(createSchema(ViewChainV1))

	await tester(gql`mutation { createSource(data: { value: 5 }) { ok } }`)
		.expect({ data: { createSource: { ok: true } } })
		.expect(200)

	// adding a column to ViewA is not replaceable -> full cascade
	const diff = diffSchemas(createSchema(ViewChainV1), createSchema(ViewChainV2Structural))
	expect(diff.some(it => it.modification === 'updateView')).toBe(false)
	expect(diff.filter(it => it.modification === 'removeEntity').map(it => (it as any).entityName))
		.toEqual(['ViewC', 'ViewB', 'ViewA'])
	expect(diff.some(it => it.modification === 'createView')).toBe(true)

	await tester.migrate(diff, '2024-07-01-130000-add-view-a-column')

	// the cascade rebuilt the whole chain; ViewC (which does not select the new column) is unaffected
	await tester(gql`query { listViewC { value } }`)
		.expect({ data: { listViewC: [{ value: 5 }] } })
		.expect(200)

	// the new column is available on the recreated ViewA
	await tester(gql`query { listViewA { value big } }`)
		.expect({ data: { listViewA: [{ value: 5, big: 500 }] } })
		.expect(200)
})
