import { describe, expect, it } from 'vitest'
import { EntityAccessor, EntitySubTree, Field } from '../../../../src'
import { createBindingWithEntitySubtree } from './bindingFactory'

const prepareBeforePersistTest = ({ event }: { event: (getAccessor: () => EntityAccessor) => any }) => {
	return createBindingWithEntitySubtree({
		node: (
			<EntitySubTree entity="Foo(bar = 123)" onBeforePersist={event}>
				<Field field={'fooField'} />
			</EntitySubTree>
		),
		schema: {
			enums: [],
			entities: [{
				name: 'Foo',
				customPrimaryAllowed: false,
				unique: [],
				fields: [{
					__typename: '_Column',
					type: 'String',
					enumName: null,
					nullable: true,
					defaultValue: null,
					name: 'fooField',
				}],
			}],
		},
	})
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
