import { expect, it, describe } from 'vitest'
import {
	EntityFieldMarker,
	EntityFieldMarkersContainer,
	EntityListSubTree,
	EntityListSubTreeMarker,
	EntitySubTree,
	EntitySubTreeMarker,
	Environment, EventListenersStore,
	Field,
	FieldMarker,
	HasMany,
	HasManyRelationMarker,
	HasOne,
	HasOneRelationMarker,
	MarkerTreeGenerator,
	MarkerTreeRoot,
	ParentEntity,
	PlaceholderName,
	PRIMARY_KEY_NAME,
	SubTreeMarkers,
} from '../../../../src'
import { Schema, SchemaRelation } from '../../../../src/core/schema'
import { SchemaPreprocessor } from '../../../../src/core/schema/SchemaPreprocessor'

describe('Marker tree generator', () => {
	it('should accept empty trees', () => {
		const generator = new MarkerTreeGenerator(<></>)

		expect(generator.generate()).toEqual(new MarkerTreeRoot(new Map(), new Map()))
	})

	it('combine nested markers', () => {
		const onInit1 = () => {
		}
		const onInit2 = () => {
		}
		const onInit3 = () => {
		}
		const onInit4 = () => {
		}
		const onInit5 = () => {
		}
		const onInit6 = () => {
		}
		const onInit7 = () => {
		}
		const onInit8 = () => {
		}
		const onInit9 = () => {
		}

		const onBeforePersist1 = () => {
		}
		const onBeforePersist2 = () => {
		}
		const onBeforePersist3 = () => {
		}
		let schema = new Schema(SchemaPreprocessor.processRawSchema({
			entities: [
				{
					name: 'Foo',
					customPrimaryAllowed: false,
					unique: { fields: new Set() },
					fields: [
						{
							__typename: '_Column',
							name: 'id',
							nullable: false,
							defaultValue: null,
							type: 'Uuid',
							enumName: null,
						},
						{
							__typename: '_Relation',
							name: 'hasMany',
							targetEntity: 'Bar',
							type: 'OneHasMany',
							nullable: null,
							ownedBy: 'hasOne',
							side: 'inverse',
							orderBy: null,
							onDelete: null,
							orphanRemoval: null,
						},
						{
							__typename: '_Relation',
							name: 'common',
							targetEntity: 'Bar',
							type: 'OneHasMany',
							nullable: null,
							ownedBy: 'hasOne',
							side: 'inverse',
							orderBy: null,
							onDelete: null,
							orphanRemoval: null,
						},

						{
							__typename: '_Column',
							name: 'fooField',
							nullable: false,
							defaultValue: null,
							type: 'String',
							enumName: null,
						},
						{
							__typename: '_Column',
							name: 'hasOneField',
							nullable: false,
							defaultValue: null,
							type: 'String',
							enumName: null,
						},
					],
				},
				{
					name: 'Bar',
					customPrimaryAllowed: false,
					unique: { fields: new Set() },
					fields: [
						{
							__typename: '_Column',
							name: 'id',
							nullable: false,
							defaultValue: null,
							type: 'Uuid',
							enumName: null,
						},
						{
							__typename: '_Relation',
							name: 'hasOne',
							targetEntity: 'Foo',
							type: 'ManyHasOne',
							nullable: null,
							inversedBy: 'hasMany',
							side: 'owning',
							orderBy: null,
							onDelete: null,
							orphanRemoval: null,
						},

						{
							__typename: '_Column',
							name: 'hasManyField',
							nullable: false,
							defaultValue: null,
							type: 'String',
							enumName: null,
						},
						{
							__typename: '_Column',
							name: 'same',
							nullable: false,
							defaultValue: null,
							type: 'String',
							enumName: null,
						},
						{
							__typename: '_Column',
							name: 'name',
							nullable: false,
							defaultValue: null,
							type: 'String',
							enumName: null,
						},
						{
							__typename: '_Column',
							name: 'surname',
							nullable: false,
							defaultValue: null,
							type: 'String',
							enumName: null,
						},
						{
							__typename: '_Column',
							name: 'whatever',
							nullable: false,
							defaultValue: null,
							type: 'String',
							enumName: null,
						},
					],
				},

			],
			enums: [],
		}))
		const environment = Environment.create()
			.withSchema(schema)

		const generator = new MarkerTreeGenerator(
			(
				<>
					<EntitySubTree entity="Foo(bar = 123)" onBeforePersist={onBeforePersist1}>
						<ParentEntity onInitialize={onInit1} />
						<HasMany field="hasMany[x > 50]">
							<Field field="hasManyField" />
							<HasOne field="hasOne" onBeforePersist={onBeforePersist2}>
								<ParentEntity onInitialize={onInit7} />
								<HasMany field="common">
									<Field field="same" />
									<ParentEntity onInitialize={onInit5}>
										<Field field="name" />
									</ParentEntity>
								</HasMany>
							</HasOne>
						</HasMany>
						<ParentEntity onInitialize={onInit2}>
							<ParentEntity onInitialize={onInit3} />
							<Field field="fooField" />
						</ParentEntity>
					</EntitySubTree>
					<EntitySubTree entity="Foo(bar = 123)">
						<ParentEntity onInitialize={onInit4}>
							<HasMany field="hasMany[x > 50]">
								<HasOne field="hasOne">
									<ParentEntity onInitialize={onInit8}>
										<HasMany field="common" onBeforePersist={onBeforePersist3}>
											<Field field="surname" />
											<Field field="same" />
											<ParentEntity onInitialize={onInit6} />
											<EntityListSubTree entities="Bar">
												<ParentEntity onInitialize={onInit9}>
													<Field field="whatever" />
												</ParentEntity>
											</EntityListSubTree>
										</HasMany>
										<Field field="hasOneField" />
									</ParentEntity>
								</HasOne>
							</HasMany>
						</ParentEntity>
					</EntitySubTree>
				</>
			),
			environment,
		)

		const idMarker = [PRIMARY_KEY_NAME, new FieldMarker(PRIMARY_KEY_NAME)] as const
		const fooEntity = schema.getEntity('Foo')!
		const barEntity = schema.getEntity('Bar')!
		const subTreeEnv = environment.withSubTree({
			entity: fooEntity,
			expectedCardinality: 'one',
			filter: {
				bar: {
					eq: 123,
				},
			},
			type: 'subtree-entity',
		})
		const outerHasManyEnv = subTreeEnv.withSubTreeChild({
			type: 'entity-list',
			field: schema.getEntityField('Foo', 'hasMany')! as SchemaRelation,
			entity: barEntity,
		})
		const hasOneEnv = outerHasManyEnv.withSubTreeChild({
			type: 'entity',
			field: schema.getEntityField('Bar', 'hasOne')! as SchemaRelation,
			entity: fooEntity,
		})
		const innerHasManyEnv = hasOneEnv.withSubTreeChild({
			type: 'entity-list',
			field: schema.getEntityField('Foo', 'common')! as SchemaRelation,
			entity: barEntity,
		})

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
				childEventListeners: new EventListenersStore(undefined, new Map([['initialize', new Set([onInit5, onInit6])]])),
				eventListeners: new EventListenersStore(undefined, new Map([['beforePersist', new Set([onBeforePersist3])]])),
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
			innerHasManyEnv,
		)

		const hasOne = new HasOneRelationMarker(
			{
				field: 'hasOne',
				setOnCreate: undefined,
				filter: undefined,
				// forceCreation: false,
				isNonbearing: false,
				reducedBy: undefined,
				eventListeners: new EventListenersStore(undefined, new Map([
					['initialize', new Set([onInit7, onInit8])],
					['beforePersist', new Set([onBeforePersist2])],
				])),
				expectedMutation: 'anyMutation',
			},
			new EntityFieldMarkersContainer(
				true,
				new Map<PlaceholderName, EntityFieldMarker>([
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
			hasOneEnv,
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
				childEventListeners: undefined,
				eventListeners: undefined,
				expectedMutation: 'anyMutation',
			},
			new EntityFieldMarkersContainer(
				true,
				new Map<PlaceholderName, EntityFieldMarker>([
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
			outerHasManyEnv,
		)
		const subTreeMarker = new EntitySubTreeMarker(
			{
				entityName: 'Foo',
				where: { bar: 123 },
				filter: undefined,
				hasOneRelationPath: [],
				isCreating: false,
				isNonbearing: false,
				setOnCreate: undefined,
				// forceCreation: false,
				eventListeners: new EventListenersStore(undefined, new Map([
					['initialize', new Set([onInit1, onInit2, onInit3, onInit4])],
					['beforePersist', new Set([onBeforePersist1])],
				])),
				expectedMutation: 'anyMutation',
				alias: undefined,
			},
			new EntityFieldMarkersContainer(
				true,
				new Map<PlaceholderName, EntityFieldMarker>([
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
			subTreeEnv,
		)
		const listSubTreeMarker = new EntityListSubTreeMarker(
			{
				entityName: 'Bar',
				filter: undefined,
				hasOneRelationPath: [],
				isCreating: false,
				isNonbearing: false,
				setOnCreate: undefined,
				// forceCreation: false,
				childEventListeners: new EventListenersStore(undefined, new Map([['initialize', new Set([onInit9])]])),
				eventListeners: undefined,
				expectedMutation: 'anyMutation',
				alias: undefined,
				initialEntityCount: 0,
				limit: undefined,
				offset: undefined,
				orderBy: undefined,
			},
			new EntityFieldMarkersContainer(
				true,
				new Map<PlaceholderName, EntityFieldMarker>([idMarker, ['whatever', new FieldMarker('whatever')]]),
				new Map([
					[PRIMARY_KEY_NAME, idMarker[1].placeholderName],
					['whatever', 'whatever'],
				]),
			),
			environment.withSubTree({
				expectedCardinality: 'zero-to-many',
				entity: schema.getEntity('Bar')!,
				filter: {},
				type: 'subtree-entity-list',
			}),
		)
		const subTreeMarkers: SubTreeMarkers = new Map()
		subTreeMarkers.set(subTreeMarker.placeholderName, subTreeMarker)
		subTreeMarkers.set(listSubTreeMarker.placeholderName, listSubTreeMarker)

		const generated = generator.generate()
		expect(generated).toEqual(new MarkerTreeRoot(subTreeMarkers, new Map()))
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
