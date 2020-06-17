import 'jasmine'
import React from 'react'
import { EntityListSubTree, Field, HasMany, HasOne, SingleEntitySubTree } from '../../../../src/coreComponents'
import { MarkerTreeGenerator } from '../../../../src/model'

describe('Marker tree generator', () => {
	it('should reject empty trees', () => {
		const generator = new MarkerTreeGenerator((<></>))

		expect(() => generator.generate()).toThrowError(/empty/i)
	})

	it('should reject top-level fields and relations', () => {
		const topOne = (
			<HasOne field="foo">
				<Field field="bar" />
			</HasOne>
		)
		const topMany = (
			<HasMany field="foo">
				<Field field="bar" />
			</HasMany>
		)
		const topField = <Field field="foo" />

		for (const faultyTop of [topOne, topMany, topField]) {
			expect(() => new MarkerTreeGenerator(faultyTop).generate()).toThrowError()
		}
	})

	it('should enforce mandatory children', () => {
		const list = (
			<EntityListSubTree entities="Foo">
				<></>
			</EntityListSubTree>
		)
		const hasOne = (
			<SingleEntitySubTree entity="Foo">
				<HasOne field="foo">
					<></>
				</HasOne>
			</SingleEntitySubTree>
		)
		const hasMany = (
			<SingleEntitySubTree entity="Foo">
				<HasMany field="foo">
					<></>
				</HasMany>
			</SingleEntitySubTree>
		)

		for (const faultyChildren of [list, hasOne, hasMany]) {
			expect(() => new MarkerTreeGenerator(faultyChildren).generate()).toThrowError()
		}
	})
})
