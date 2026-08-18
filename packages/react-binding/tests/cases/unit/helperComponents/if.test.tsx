import { describe, expect, it } from 'bun:test'
import { EntitySubTree, Field, HasOne, If } from '../../../../src/index.js'
import { createBinding } from '../../../lib/bindingFactory.js'
import { c, createSchema } from '@contember/schema-definition'
import { convertModelToAdminSchema } from '../../../lib/convertModelToAdminSchema.js'
import { EntityFieldMarkersContainer, HasOneRelationMarker, MarkerTreeRoot } from '@contember/binding'
import assert from 'assert'

namespace IfModel {
	export class Article {
		title = c.stringColumn()
		image = c.oneHasOne(Image).inversedBy('article')
	}

	export class Image {
		type = c.stringColumn()
		url = c.stringColumn()
	}
}

const schema = convertModelToAdminSchema(createSchema(IfModel).model)

const getImageFields = (markerTree: MarkerTreeRoot): EntityFieldMarkersContainer => {
	const subTree = Array.from(markerTree.subTrees.values())[0]
	const image = Array.from(subTree.fields.markers.values()).find(
		(it): it is HasOneRelationMarker => it instanceof HasOneRelationMarker && it.parameters.field === 'image',
	)
	assert(image !== undefined)
	return image.fields
}

describe('If', () => {
	it('registers the fields of its condition as nonbearing', () => {
		const { markerTree } = createBinding({
			node: (
				<EntitySubTree entity="Article(id = '123')">
					<HasOne field="image">
						<If condition="[type = 'hero']">
							<Field field="url" />
						</If>
					</HasOne>
				</EntitySubTree>
			),
			schema,
		})

		const fields = getImageFields(markerTree)
		// Deciding what to render must not be a reason to create the image — only filling the url is.
		expect(fields.markers.get('type')?.isNonbearing).toBe(true)
		expect(fields.markers.get('url')?.isNonbearing).toBe(false)
	})

	it('keeps the field bearing when it is also rendered as one', () => {
		const { markerTree } = createBinding({
			node: (
				<EntitySubTree entity="Article(id = '123')">
					<HasOne field="image">
						<Field field="type" />
						<If condition="[type = 'hero']" />
					</HasOne>
				</EntitySubTree>
			),
			schema,
		})

		expect(getImageFields(markerTree).markers.get('type')?.isNonbearing).toBe(false)
	})
})
