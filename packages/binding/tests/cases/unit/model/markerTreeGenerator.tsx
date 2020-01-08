import 'jasmine'
import React from 'react'
import {
	EntityListDataProvider,
	Field,
	HasMany,
	HasOne,
	SingleEntityDataProvider,
} from '../../../../src/coreComponents'
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
			<EntityListDataProvider entities="Foo">
				<></>
			</EntityListDataProvider>
		)
		const hasOne = (
			<SingleEntityDataProvider entity="Foo">
				<HasOne field="foo">
					<></>
				</HasOne>
			</SingleEntityDataProvider>
		)
		const hasMany = (
			<SingleEntityDataProvider entity="Foo">
				<HasMany field="foo">
					<></>
				</HasMany>
			</SingleEntityDataProvider>
		)

		for (const faultyChildren of [list, hasOne, hasMany]) {
			expect(() => new MarkerTreeGenerator(faultyChildren).generate()).toThrowError()
		}
	})
})
