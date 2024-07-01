import { describe, expect, it } from 'vitest'
import { EntitySubTree, Field, HasOne } from '../../../../src'
import { createBinding } from '../../../lib/bindingFactory'
import { c, createSchema } from '@contember/schema-definition'
import { convertModelToAdminSchema } from '../../../lib/convertModelToAdminSchema'
import assert from 'assert'


namespace TrackChangesModel {
	export class Foo {
		fooField = c.stringColumn()
	}
}

describe('entity operations', () => {
	it('tracks unpersisted changes count', () => {
		const { treeStore } = createBinding({
			node: (
				<EntitySubTree entity="Foo(bar = 123)">
					<Field field={'fooField'} />
				</EntitySubTree>
			),
			schema: convertModelToAdminSchema(createSchema(TrackChangesModel).model),
		})

		const entity = Array.from(treeStore.subTreeStatesByRoot.get(undefined)!.values())[0]
		assert(entity.type === 'entityRealm')

		expect(entity.unpersistedChangesCount).eq(0)
		entity.getAccessor().getField('fooField').updateValue('bar')
		expect(entity.unpersistedChangesCount).eq(1)
		entity.getAccessor().getField('fooField').updateValue(null)
		expect(entity.unpersistedChangesCount).eq(0)
	})
})
