import { afterEach, describe, expect, it } from 'bun:test'
import { screen } from '@testing-library/react'
import { c, createSchema } from '@contember/schema-definition'
import { ReactNode, useCallback } from 'react'
import {
	Component,
	EntitySubTree,
	Field,
	HasMany,
	HasOne,
	useAccessorUpdateSubscription,
	useEntity,
	useEntityKey,
	useEntityList,
	useField,
	useGetEntityByKey,
} from '../../../../src/index.js'
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
const blockAId = 'dddddddd-0000-0000-0000-000000000001'
const blockBId = 'dddddddd-0000-0000-0000-000000000002'
const blockCId = 'dddddddd-0000-0000-0000-000000000003'

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

const page = (id: string, url: string, blockId: string, label: string) => ({ id, url, blocks: [{ id: blockId, label }] })

const probes = (
	<>
		<FieldProbe />
		<EntityProbe />
		<EntityListProbe />
	</>
)

const mount = (itemChildren: ReactNode = probes) =>
	createBindingHarness({
		schema,
		data: {
			item: { id: itemId, link: { id: linkAId, target: page(pageAId, 'A', blockAId, 'a') } },
			linkB: { id: linkBId, target: page(pageCId, 'C', blockCId, 'c') },
			pageB: page(pageBId, 'B', blockBId, 'b'),
		},
		node: (
			<>
				<EntitySubTree entity={`Item(id = '${itemId}')`} alias="item">
					{itemChildren}
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
			target.getEntityList('blocks').getChildEntityById(blockBId).getField('label').updateValue('b2')
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

	// Passes on the old code too: a reconnected relation keeps refiring connectionUpdate on later updates, which masks a stale listener.
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

describe('useAccessorUpdateSubscription', () => {
	// Kept outside React so the test can ask the probe to re-resolve its getter, as a connectionUpdate listener would.
	let refreshProbe: (() => void) | undefined

	const SubscriptionProbe = Component(
		() => {
			const entityKey = useEntityKey()
			const getEntityByKey = useGetEntityByKey()
			const getUrl = useCallback(() => getEntityByKey(entityKey).getField<string>('link.target.url'), [entityKey, getEntityByKey])
			const [url, { update }] = useAccessorUpdateSubscription(getUrl)
			refreshProbe = update
			return <span data-testid="subscription">{url.value ?? 'null'}</span>
		},
		() => (
			<HasOne field="link">
				<HasOne field="target">
					<Field field="url" />
				</HasOne>
			</HasOne>
		),
	)

	it('follows updates of the accessor the getter resolves to now, not of the one from mount', async () => {
		const h = (harness = await mount(<SubscriptionProbe />))
		await h.update(() => {
			h.getEntity('item').getEntity('link').connectEntityAtField('target', h.getEntity('pageB'))
			refreshProbe?.()
		})
		expect(screen.getByTestId('subscription').textContent).toBe('B')

		await h.update(() => {
			h.getEntity('item').getEntity('link').getEntity('target').getField('url').updateValue('B2')
		})

		expect(screen.getByTestId('subscription').textContent).toBe('B2')
	})
})
