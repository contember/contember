import { expect, it, describe } from 'vitest'
import assert from 'assert'
import { StateInitializer } from '../../../../src/core/StateInitializer'
import {
	EntityAccessor,
	EntityEventListenerStore,
	EntityFieldMarker,
	EntityFieldMarkersContainer,
	EntitySubTreeMarker, Environment,
	EventListenersStore, FieldMarker,
	MarkerTreeRoot,
	PlaceholderName, PRIMARY_KEY_NAME,
} from '../../../../src'
import { TreeStore } from '../../../../src/core/TreeStore'
import { Schema } from '../../../../src/core/schema'
import { EventManager } from '../../../../src/core/EventManager'
import { DirtinessTracker } from '../../../../src/core/DirtinessTracker'
import { Config } from '../../../../src/core/Config'
import { TreeAugmenter } from '../../../../src/core/TreeAugmenter'

const prepareBeforePersistTest = ({ event }: { event: (getAccessor: () => EntityAccessor) => any }) => {
	const treeStore = new TreeStore()
	treeStore.setSchema(
		new Schema({
			enums: new Map(),
			entities: new Map([
					['Foo', {
						customPrimaryAllowed: false,
						fields: new Map([
							['fooField', {
								__typename: '_Column',
								name: 'fooField',
								defaultValue: null,
								nullable: false,
								enumName: null,
								type: 'String',
							}],
						]),
						name: 'Foo',
						unique: { fields: new Set() },
					}],
				],
			),
		}),
	)
	const config = new Config()
	const eventManager = new EventManager({} as any, {} as any, config, new DirtinessTracker(), () => null, treeStore)
	const stateInitializer = new StateInitializer(
		{} as any,
		{} as any,
		eventManager,
		treeStore,
	)
	const environment = new Environment()
	const idMarker = [PRIMARY_KEY_NAME, new FieldMarker(PRIMARY_KEY_NAME)] as const
	const eventListenersStore: EntityEventListenerStore = new EventListenersStore()
	eventListenersStore.set({ type: 'beforePersist' }, new Set([event]))

	const treeAugmenter = new TreeAugmenter(eventManager, stateInitializer, treeStore)
	const entitySubTreeMarker = new EntitySubTreeMarker(
		{
			entityName: 'Foo',
			where: { bar: 123 },
			filter: undefined,
			hasOneRelationPath: [],
			isCreating: false,
			isNonbearing: false,
			setOnCreate: undefined,
			// forceCreation: false,
			eventListeners: eventListenersStore,
			expectedMutation: 'anyMutation',
			alias: undefined,
		},
		new EntityFieldMarkersContainer(
			true,
			new Map<PlaceholderName, EntityFieldMarker>([
				idMarker,
				['fooField', new FieldMarker('fooField')],
			]),
			new Map([
				[PRIMARY_KEY_NAME, idMarker[1].placeholderName],
				['fooField', 'fooField'],
			]),
		),
		environment,
	)
	treeAugmenter.extendTreeStates(undefined, new MarkerTreeRoot(new Map([
		[entitySubTreeMarker.placeholderName, entitySubTreeMarker],
	]), new Map([[entitySubTreeMarker.placeholderName, entitySubTreeMarker.placeholderName]])))

	const subtree = treeStore.getSubTreeState('entity', undefined, entitySubTreeMarker.placeholderName, environment)

	expect(subtree.type).eq('entityRealm')
	assert(subtree.type === 'entityRealm')
	return { entity: subtree, eventManager }
}

describe('event manager', () => {
	it('triggers sync beforePersist', async () => {
		const { entity, eventManager } = prepareBeforePersistTest({
			event: getAccessor => {
				getAccessor().getField('fooField').updateValue('lorem')
			},
		})
		entity.getAccessor().getField('fooField').updateValue('bar')
		await eventManager.triggerOnBeforePersist()
		expect(entity.getAccessor().getField('fooField').value).eq('lorem')
	})

	it('triggers async beforePersist returning sync callback', async () => {
		const { entity, eventManager } = prepareBeforePersistTest({
			event: async getAccessor => {
				await new Promise(resolve => setTimeout(resolve, 1))
				return () => {
					getAccessor().getField('fooField').updateValue('lorem')
				}
			},
		})
		entity.getAccessor().getField('fooField').updateValue('bar')
		await eventManager.triggerOnBeforePersist()
		expect(entity.getAccessor().getField('fooField').value).eq('lorem')
	})

	it('fails when triggering async beforePersist, trying to update data #1', async () => {
		const { entity, eventManager } = prepareBeforePersistTest({
			event: async getAccessor => {
				getAccessor().getField('fooField').updateValue('lorem')
				await new Promise(resolve => setTimeout(resolve, 1))
			},
		})
		entity.getAccessor().getField('fooField').updateValue('bar')
		await expect(() => eventManager.triggerOnBeforePersist()).rejects.toThrow('A beforePersist event handler cannot be asynchronous and alter the accessor tree at the same time. To achieve this, prepare your data asynchronously but only touch the tree from a returned callback.')
	})


	it('fails when triggering async beforePersist, trying to update data #2', async () => {
		const { entity, eventManager } = prepareBeforePersistTest({
			event: async getAccessor => {
				await new Promise(resolve => setTimeout(resolve, 1))
				getAccessor().getField('fooField').updateValue('lorem')
			},
		})
		entity.getAccessor().getField('fooField').updateValue('bar')
		await expect(() => eventManager.triggerOnBeforePersist()).rejects.toThrow('A beforePersist event handler cannot be asynchronous and alter the accessor tree at the same time. To achieve this, prepare your data asynchronously but only touch the tree from a returned callback.')
	})

	it('fails when sync event handler fails', async () => {
		const { entity, eventManager } = prepareBeforePersistTest({
			event: getAccessor => {
				throw new Error()
			},
		})
		entity.getAccessor().getField('fooField').updateValue('bar')
		await expect(() => eventManager.triggerOnBeforePersist()).rejects.toThrow('A beforePersist handler returned a promise that rejected. This is a no-op that will fail silently in production.')
	})


	it('fails when async event handler fails', async () => {
		const { entity, eventManager } = prepareBeforePersistTest({
			event: async getAccessor => {
				await new Promise(resolve => setTimeout(resolve, 1))
				throw new Error()
			},
		})
		entity.getAccessor().getField('fooField').updateValue('bar')
		await expect(() => eventManager.triggerOnBeforePersist()).rejects.toThrow('A beforePersist handler returned a promise that rejected. This is a no-op that will fail silently in production.')
	})

	it('fails when async event handler fails #2', async () => {
		const { entity, eventManager } = prepareBeforePersistTest({
			event: async getAccessor => {
				throw new Error()
			},
		})
		entity.getAccessor().getField('fooField').updateValue('bar')
		await expect(() => eventManager.triggerOnBeforePersist()).rejects.toThrow('A beforePersist handler returned a promise that rejected. This is a no-op that will fail silently in production.')
	})
})
