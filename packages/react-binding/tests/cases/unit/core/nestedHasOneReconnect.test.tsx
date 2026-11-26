import { afterEach, describe, expect, it } from 'bun:test'
import { screen } from '@testing-library/react'
import { c, createSchema } from '@contember/schema-definition'
import { Component, EntitySubTree, Field, HasMany, HasOne, useEntity, useEntityList, useField } from '../../../../src/index.js'
import { convertModelToAdminSchema } from '../../../lib/convertModelToAdminSchema.js'
import { BindingHarness, createBindingHarness } from '../../../lib/harness/index.js'

namespace Model {
	export class Item {
		link = c.manyHasOne(Link)
	}

	export class Link {
		target = c.manyHasOne(Page)
	}

	export class Page {
		url = c.stringColumn()
		blocks = c.oneHasMany(Block, 'page')
	}

	export class Block {
		label = c.stringColumn()
		page = c.manyHasOne(Page, 'blocks')
	}
}

const schema = convertModelToAdminSchema(createSchema(Model).model)
const itemId = 'aaaaaaaa-0000-0000-0000-000000000001'
const linkAId = 'bbbbbbbb-0000-0000-0000-000000000001'
const linkBId = 'bbbbbbbb-0000-0000-0000-000000000002'
const pageAId = 'cccccccc-0000-0000-0000-000000000001'
const pageBId = 'cccccccc-0000-0000-0000-000000000002'
const pageCId = 'cccccccc-0000-0000-0000-000000000003'

const pageFields = (
	<>
		<Field field="url" />
		<HasMany field="blocks">
			<Field field="label" />
		</HasMany>
	</>
)

// Every hook resolves a path whose second hop is `target`, starting from the item.
const FieldProbe = Component(
	() => <span data-testid="field">{useField<string>('link.target.url').value ?? 'null'}</span>,
	() => (
		<HasOne field="link">
			<HasOne field="target">
				<Field field="url" />
			</HasOne>
		</HasOne>
	),
)

const EntityProbe = Component(
	() => <span data-testid="entity">{useEntity('link.target').getField<string>('url').value ?? 'null'}</span>,
	() => (
		<HasOne field="link">
			<HasOne field="target">
				<Field field="url" />
			</HasOne>
		</HasOne>
	),
)

const EntityListProbe = Component(
	() => {
		const blocks = useEntityList('link.target.blocks')
		return <span data-testid="list">{Array.from(blocks, it => it.getField<string>('label').value).join(',')}</span>
	},
	() => (
		<HasOne field="link">
			<HasOne field="target">
				<HasMany field="blocks">
					<Field field="label" />
				</HasMany>
			</HasOne>
		</HasOne>
	),
)

const page = (id: string, url: string, label: string) => ({ id, url, blocks: [{ id: id.replace(/^c/, 'd'), label }] })

const mount = () =>
	createBindingHarness({
		schema,
		data: {
			item: { id: itemId, link: { id: linkAId, target: page(pageAId, 'A', 'a') } },
			linkB: { id: linkBId, target: page(pageCId, 'C', 'c') },
			pageB: page(pageBId, 'B', 'b'),
		},
		node: (
			<>
				<EntitySubTree entity={`Item(id = '${itemId}')`} alias="item">
					<FieldProbe />
					<EntityProbe />
					<EntityListProbe />
				</EntitySubTree>
				<EntitySubTree entity={`Link(id = '${linkBId}')`} alias="linkB">
					<HasOne field="target">{pageFields}</HasOne>
				</EntitySubTree>
				<EntitySubTree entity={`Page(id = '${pageBId}')`} alias="pageB">
					{pageFields}
				</EntitySubTree>
			</>
		),
	})

const rendered = () => ({
	field: screen.getByTestId('field').textContent,
	entity: screen.getByTestId('entity').textContent,
	list: screen.getByTestId('list').textContent,
})

let harness: BindingHarness | undefined
afterEach(() => {
	harness?.unmount()
	harness = undefined
})

describe('hooks resolving a path through a reconnected has-one relation', () => {
	it('follow a reconnect of the second relation in the path', async () => {
		const h = (harness = await mount())
		expect(rendered()).toEqual({ field: 'A', entity: 'A', list: 'a' })

		await h.update(() => {
			h.getEntity('item').getEntity('link').connectEntityAtField('target', h.getEntity('pageB'))
		})

		expect(rendered()).toEqual({ field: 'B', entity: 'B', list: 'b' })
	})

	it('follow edits of the newly connected entity', async () => {
		const h = (harness = await mount())
		await h.update(() => {
			h.getEntity('item').getEntity('link').connectEntityAtField('target', h.getEntity('pageB'))
		})

		await h.update(() => {
			const target = h.getEntity('item').getEntity('link').getEntity('target')
			target.getField('url').updateValue('B2')
			target.getEntityList('blocks').getChildEntityById('dccccccc-0000-0000-0000-000000000002').getField('label').updateValue('b2')
		})

		expect(rendered()).toEqual({ field: 'B2', entity: 'B2', list: 'b2' })
	})

	it('stop following the disconnected entity', async () => {
		const h = (harness = await mount())
		await h.update(() => {
			h.getEntity('item').getEntity('link').connectEntityAtField('target', h.getEntity('pageB'))
		})

		await h.update(() => {
			h.getEntity('item').getEntity('link').disconnectEntityAtField('target')
		})

		expect(rendered()).toEqual({ field: 'null', entity: 'null', list: '' })
	})

	it('follow a reconnect of the first relation and then of the second one', async () => {
		const h = (harness = await mount())
		await h.update(() => {
			h.getEntity('item').connectEntityAtField('link', h.getEntity('linkB'))
		})
		expect(rendered()).toEqual({ field: 'C', entity: 'C', list: 'c' })

		await h.update(() => {
			h.getEntity('item').getEntity('link').connectEntityAtField('target', h.getEntity('pageB'))
		})

		expect(rendered()).toEqual({ field: 'B', entity: 'B', list: 'b' })
	})
})
