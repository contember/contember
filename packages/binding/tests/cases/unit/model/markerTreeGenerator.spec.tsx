import {
	EntityFieldMarkersContainer,
	EntitySubTree,
	EntitySubTreeMarker,
	Environment,
	Field,
	FieldMarker,
	HasMany,
	HasManyRelationMarker,
	HasOne,
	HasOneRelationMarker,
	Marker,
	MarkerTreeGenerator,
	MarkerTreeRoot,
	PRIMARY_KEY_NAME,
} from '../../../../src'

describe('Marker tree generator', () => {
	it('should reject empty trees', () => {
		const generator = new MarkerTreeGenerator(<></>)

		expect(() => generator.generate()).toThrowError(/empty/i)
	})

	it('combine nested markers', () => {
		const generator = new MarkerTreeGenerator(
			(
				<>
					<EntitySubTree entity="Foo(bar = 123)">
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
					</EntitySubTree>
					<EntitySubTree entity="Foo(bar = 123)">
						<HasMany field="hasMany[x > 50]">
							<HasOne field="hasOne">
								<HasMany field="common">
									<Field field="surname" />
									<Field field="same" />
								</HasMany>
								<Field field="hasOneField" />
							</HasOne>
						</HasMany>
					</EntitySubTree>
				</>
			),
		)

		const environment = Environment.create({
			rootWhere: { bar: 123 },
			rootWhereAsFilter: { bar: { eq: 123 } },
		})
		const idMarker = [PRIMARY_KEY_NAME, new FieldMarker(PRIMARY_KEY_NAME)] as const

		const singleListeners = {
			beforePersist: undefined,
			initialize: undefined,
			connectionUpdate: undefined,
			beforeUpdate: undefined,
			persistSuccess: undefined,
			persistError: undefined,
			update: undefined,
		} as const
		const listListeners = {
			beforePersist: undefined,
			initialize: undefined,
			childInitialize: undefined,
			beforeUpdate: undefined,
			persistSuccess: undefined,
			persistError: undefined,
			update: undefined,
		} as const
		const innerHasMany = new HasManyRelationMarker(
			{
				field: 'common',
				filter: undefined,
				setOnCreate: undefined,
				// forceCreation: false,
				isNonbearing: false,
				initialEntityCount: 0,
				orderBy: undefined,
				offset: undefined,
				limit: undefined,
				eventListeners: listListeners,
				expectedMutation: 'anyMutation',
			},
			new EntityFieldMarkersContainer(
				true,
				new Map([
					idMarker,
					['same', new FieldMarker('same')],
					['name', new FieldMarker('name')],
					['surname', new FieldMarker('surname')],
				]),
				new Map([
					[PRIMARY_KEY_NAME, idMarker[1].placeholderName],
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
				// forceCreation: false,
				isNonbearing: false,
				reducedBy: undefined,
				eventListeners: singleListeners,
				expectedMutation: 'anyMutation',
			},
			new EntityFieldMarkersContainer(
				true,
				new Map<string, Marker>([
					idMarker,
					[innerHasMany.placeholderName, innerHasMany],
					['hasOneField', new FieldMarker('hasOneField')],
				]),
				new Map([
					[PRIMARY_KEY_NAME, idMarker[1].placeholderName],
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
				// forceCreation: false,
				isNonbearing: false,
				initialEntityCount: 0,
				orderBy: undefined,
				offset: undefined,
				limit: undefined,
				eventListeners: listListeners,
				expectedMutation: 'anyMutation',
			},
			new EntityFieldMarkersContainer(
				true,
				new Map<string, Marker>([
					idMarker,
					['hasManyField', new FieldMarker('hasManyField')],
					[hasOne.placeholderName, hasOne],
				]),
				new Map([
					[PRIMARY_KEY_NAME, idMarker[1].placeholderName],
					['hasManyField', 'hasManyField'],
					[hasOne.parameters.field, hasOne.placeholderName],
				]),
			),
			environment,
		)
		const subTreeMarker = new EntitySubTreeMarker(
			{
				entityName: 'Foo',
				where: { bar: 123 },
				filter: undefined,
				hasOneRelationPath: [],
				isCreating: false,
				isNonbearing: false,
				setOnCreate: { bar: 123 },
				// forceCreation: false,
				eventListeners: singleListeners,
				expectedMutation: 'anyMutation',
				alias: undefined,
			},
			new EntityFieldMarkersContainer(
				true,
				new Map<string, Marker>([
					idMarker,
					[outerHasMany.placeholderName, outerHasMany],
					['fooField', new FieldMarker('fooField')],
				]),
				new Map([
					[PRIMARY_KEY_NAME, idMarker[1].placeholderName],
					[outerHasMany.parameters.field, outerHasMany.placeholderName],
					['fooField', 'fooField'],
				]),
			),
			environment,
		)
		expect(generator.generate()).toEqual(
			new MarkerTreeRoot(new Map([[subTreeMarker.placeholderName, subTreeMarker]]), new Map()),
		)
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
