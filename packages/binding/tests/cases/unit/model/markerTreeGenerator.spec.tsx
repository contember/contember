import * as React from 'react'
import { EntityFieldMarkersContainer, Environment, PRIMARY_KEY_NAME, TYPENAME_KEY_NAME } from '../../../../src'
import { Field, HasMany, HasOne, SingleEntitySubTree } from '../../../../src/coreComponents'
import {
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	Marker,
	MarkerTreeRoot,
	SubTreeMarker,
} from '../../../../src/markers'
import { MarkerTreeGenerator } from '../../../../src/model'
import { BoxedQualifiedSingleEntity } from '../../../../src/treeParameters'

describe('Marker tree generator', () => {
	it('should reject empty trees', () => {
		const generator = new MarkerTreeGenerator((<></>))

		expect(() => generator.generate()).toThrowError(/empty/i)
	})

	it('combine nested markers', () => {
		const generator = new MarkerTreeGenerator(
			(
				<>
					<SingleEntitySubTree entity="Foo(bar = 123)">
						<HasMany field="hasMany[x > 50]">
							<Field field="hasManyField" />
							<HasOne field="hasOne">
								<HasMany field="common">
									<Field field="same" />
									<Field field="name" />
								</HasMany>
							</HasOne>
						</HasMany>
						<Field field="fooField" />
					</SingleEntitySubTree>
					<SingleEntitySubTree entity="Foo(bar = 123)">
						<HasMany field="hasMany[x > 50]">
							<HasOne field="hasOne">
								<HasMany field="common">
									<Field field="surname" />
									<Field field="same" />
								</HasMany>
								<Field field="hasOneField" />
							</HasOne>
						</HasMany>
					</SingleEntitySubTree>
				</>
			),
		)

		const environment = Environment.create({
			rootWhere: { bar: 123 },
			rootWhereAsFilter: { bar: { eq: 123 } },
		})
		const idMarker = [PRIMARY_KEY_NAME, new FieldMarker(PRIMARY_KEY_NAME)] as const
		const typeNameMarker = [TYPENAME_KEY_NAME, new FieldMarker(TYPENAME_KEY_NAME)] as const

		const singleListeners = {
			beforePersist: undefined,
			initialize: undefined,
			connectionUpdate: undefined,
			beforeUpdate: undefined,
			update: undefined,
		} as const
		const listListeners = {
			beforePersist: undefined,
			initialize: undefined,
			childInitialize: undefined,
			beforeUpdate: undefined,
			update: undefined,
		} as const
		const innerHasMany = new HasManyRelationMarker(
			{
				field: 'common',
				filter: undefined,
				setOnCreate: undefined,
				forceCreation: false,
				isNonbearing: false,
				initialEntityCount: 0,
				orderBy: undefined,
				offset: undefined,
				limit: undefined,
				eventListeners: listListeners,
			},
			new EntityFieldMarkersContainer(
				true,
				new Map([
					idMarker,
					typeNameMarker,
					['same', new FieldMarker('same')],
					['name', new FieldMarker('name')],
					['surname', new FieldMarker('surname')],
				]),
				new Map([
					[PRIMARY_KEY_NAME, idMarker[1].placeholderName],
					[TYPENAME_KEY_NAME, typeNameMarker[1].placeholderName],
					['same', 'same'],
					['name', 'name'],
					['surname', 'surname'],
				]),
			),
			environment,
		)

		const hasOne = new HasOneRelationMarker(
			{
				field: 'hasOne',
				setOnCreate: undefined,
				filter: undefined,
				forceCreation: false,
				isNonbearing: false,
				reducedBy: undefined,
				eventListeners: singleListeners,
			},
			new EntityFieldMarkersContainer(
				true,
				new Map<string, Marker>([
					idMarker,
					typeNameMarker,
					[innerHasMany.placeholderName, innerHasMany],
					['hasOneField', new FieldMarker('hasOneField')],
				]),
				new Map([
					[PRIMARY_KEY_NAME, idMarker[1].placeholderName],
					[TYPENAME_KEY_NAME, typeNameMarker[1].placeholderName],
					['common', innerHasMany.placeholderName],
					['hasOneField', 'hasOneField'],
				]),
			),
			environment,
		)

		const outerHasMany = new HasManyRelationMarker(
			{
				field: 'hasMany',
				filter: { x: { gt: 50 } },
				setOnCreate: undefined,
				forceCreation: false,
				isNonbearing: false,
				initialEntityCount: 0,
				orderBy: undefined,
				offset: undefined,
				limit: undefined,
				eventListeners: listListeners,
			},
			new EntityFieldMarkersContainer(
				true,
				new Map<string, Marker>([
					idMarker,
					typeNameMarker,
					['hasManyField', new FieldMarker('hasManyField')],
					[hasOne.placeholderName, hasOne],
				]),
				new Map([
					[PRIMARY_KEY_NAME, idMarker[1].placeholderName],
					[TYPENAME_KEY_NAME, typeNameMarker[1].placeholderName],
					['hasManyField', 'hasManyField'],
					[hasOne.relation.field, hasOne.placeholderName],
				]),
			),
			environment,
		)
		const subTreeMarker = new SubTreeMarker(
			new BoxedQualifiedSingleEntity({
				entityName: 'Foo',
				where: { bar: 123 },
				filter: undefined,
				hasOneRelationPath: [],
				isNonbearing: false,
				setOnCreate: { bar: 123 },
				forceCreation: false,
				eventListeners: singleListeners,
			}),
			new EntityFieldMarkersContainer(
				true,
				new Map<string, Marker>([
					idMarker,
					typeNameMarker,
					[outerHasMany.placeholderName, outerHasMany],
					['fooField', new FieldMarker('fooField')],
				]),
				new Map([
					[PRIMARY_KEY_NAME, idMarker[1].placeholderName],
					[TYPENAME_KEY_NAME, typeNameMarker[1].placeholderName],
					[outerHasMany.relation.field, outerHasMany.placeholderName],
					['fooField', 'fooField'],
				]),
			),
			environment,
		)
		expect(generator.generate()).toEqual(new MarkerTreeRoot(new Map([[subTreeMarker.placeholderName, subTreeMarker]])))
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
})
