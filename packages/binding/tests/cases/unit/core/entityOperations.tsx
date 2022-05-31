import { describe, expect, it } from 'vitest'
import { EntitySubTree, Field } from '../../../../src'
import { createBindingWithEntitySubtree } from './bindingFactory'

describe('entity operations', () => {
	it('tracks unpersisted changes count', () => {
		const { entity } = createBindingWithEntitySubtree({
			node: (
				<EntitySubTree entity="Foo(bar = 123)">
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

		expect(entity.unpersistedChangesCount).eq(0)
		entity.getAccessor().getField('fooField').updateValue('bar')
		expect(entity.unpersistedChangesCount).eq(1)
		entity.getAccessor().getField('fooField').updateValue(null)
		expect(entity.unpersistedChangesCount).eq(0)
	})
})
