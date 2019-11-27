import 'jasmine'
import { InputPreValidator } from '../../../src/input-validation/preValidation/InputPreValidator'
import { InputValidation as v, SchemaBuilder } from '@contember/schema-definition'
import { Input, Model, Validation, Value } from '@contember/schema'
import { EntityRulesResolver } from '../../../src/input-validation/EntityRulesResolver'
import { getEntity } from '@contember/schema-utils'
import { ColumnValueResolver } from '../../../src/input-validation/ColumnValueResolver'
import Mapper from '../../../src/sql/Mapper'
import DependencyCollector from '../../../src/input-validation/dependencies/DependencyCollector'
import { createMock } from '../../src/utils'
import ValidationDataSelector from '../../../src/input-validation/ValidationDataSelector'
import { testUuid } from '../../src/testUuid'

type PrimaryValueExpectation = { entity: string; where: Input.UniqueWhere; result: Value.PrimaryValue }
type SelectExpectation = {
	entity: string
	where: Input.UniqueWhere
	dependencies: DependencyCollector.Dependencies
	result: Value.Object
}

const createDataSelectorMock = (primaryValues: PrimaryValueExpectation[], selects: SelectExpectation[]) => {
	return createMock<ValidationDataSelector>({
		getPrimaryValue: async (mapper: Mapper, entity: Model.Entity, where: Input.UniqueWhere) => {
			const entry = primaryValues.shift()
			//console.log(JSON.stringify({ entity: entity.name, where, result: undefined }))
			if (!entry) {
				throw new Error(`Unexpected getPrimaryValue call`)
			}
			expect(entity.name).toEqual(entry.entity)
			expect(where).toEqual(entry.where)
			return entry.result
		},
		select: async (
			mapper: Mapper,
			entity: Model.Entity,
			where: Input.UniqueWhere<never>,
			dependencies: DependencyCollector.Dependencies,
		) => {
			if (Object.keys(dependencies).length === 0) {
				return {}
			}
			const entry = selects.shift()
			if (!entry) {
				console.log(JSON.stringify({ entity: entity.name, where, dependencies, result: {} }))
				throw new Error(`Unexpected select call`)
			}
			expect(entity.name).toBe(entry.entity)
			expect(where).toEqual(entry.where)
			//console.log(JSON.stringify(entry))
			expect(dependencies).toEqual(entry.dependencies)
			return entry.result
		},
	})
}

const createValidator = ({
	model,
	validation,
	primaryValues,
	selects,
}: {
	model: Model.Schema
	validation: Validation.Schema
	primaryValues?: PrimaryValueExpectation[]
	selects?: SelectExpectation[]
}) =>
	new InputPreValidator(
		model,
		new EntityRulesResolver(validation, model),
		new ColumnValueResolver({
			uuid: () => '00000000-0000-0000-0000-000000000000',
			now: () => new Date(),
		}),
		createDataSelectorMock(primaryValues || [], selects || []),
	)
const mapper = {} as Mapper
describe('input pre validator', () => {
	it('validates implicit rules', async () => {
		const model = new SchemaBuilder()
			.entity('Book', e => e.column('title', c => c.notNull().type(Model.ColumnType.String)).column('description'))
			.buildSchema()

		const validator = createValidator({ model, validation: {} })
		const result = await validator.validateCreate({
			entity: getEntity(model, 'Book'),
			data: {},
			overRelation: null,
			path: [],
			mapper,
		})
		expect(result).toEqual([
			{
				path: [
					{
						field: 'title',
					},
				],
				message: {
					text: 'Field is required',
				},
			},
		])
	})

	it('validates explicit rules', async () => {
		const model = new SchemaBuilder()
			.entity('Book', e => e.column('title', c => c.notNull().type(Model.ColumnType.String)).column('description'))
			.buildSchema()

		const validator = createValidator({
			model,
			validation: {
				Book: {
					description: [{ message: { text: 'Minimum length is 10 characters' }, validator: v.rules.minLength(10) }],
				},
			},
		})
		const result = await validator.validateCreate({
			entity: getEntity(model, 'Book'),
			data: {
				title: 'Hello',
				description: 'World',
			},
			overRelation: null,
			path: [],
			mapper,
		})
		expect(result).toEqual([
			{
				path: [
					{
						field: 'description',
					},
				],
				message: {
					text: 'Minimum length is 10 characters',
				},
			},
		])

		const result2 = await validator.validateCreate({
			entity: getEntity(model, 'Book'),
			data: {
				title: 'Hello',
				description: 'World abcdef',
			},
			overRelation: null,
			path: [],
			mapper,
		})
		expect(result2).toEqual([])
	})

	it('dependent rules invalid', async () => {
		const model = new SchemaBuilder()
			.entity('Book', e => e.column('title', c => c.notNull().type(Model.ColumnType.String)).column('description'))
			.buildSchema()

		const rule = v.rules.conditional(v.rules.on('title', v.rules.notEmpty()), v.rules.minLength(10))
		const validator = createValidator({
			model,
			validation: {
				Book: {
					description: [{ message: { text: 'Minimum length is 10 characters' }, validator: rule }],
				},
			},
		})
		const result = await validator.validateCreate({
			entity: getEntity(model, 'Book'),
			data: {
				title: 'Hello',
				description: 'World',
			},
			overRelation: null,
			path: [],
			mapper,
		})
		expect(result).toEqual([
			{
				path: [
					{
						field: 'description',
					},
				],
				message: {
					text: 'Minimum length is 10 characters',
				},
			},
		])
	})

	it('dependent rules valid', async () => {
		const model = new SchemaBuilder()
			.entity('Book', e => e.column('title', c => c.notNull().type(Model.ColumnType.String)).column('description'))
			.buildSchema()

		const rule = v.rules.conditional(v.rules.on('title', v.rules.notEmpty()), v.rules.minLength(10))
		const validator = createValidator({
			model,
			validation: {
				Book: {
					description: [{ message: { text: 'Minimum length is 10 characters' }, validator: rule }],
				},
			},
		})
		const result = await validator.validateCreate({
			entity: getEntity(model, 'Book'),
			data: {
				title: '',
				description: 'World',
			},
			overRelation: null,
			path: [],
			mapper,
		})
		expect(result).toEqual([])
	})

	it('rules on relations', async () => {
		const model = new SchemaBuilder()
			.entity('Book', e =>
				e
					.column('title', c => c.notNull().type(Model.ColumnType.String))
					.manyHasOne('author', r => r.target('Author', e => e.column('name')).notNull()),
			)
			.buildSchema()

		const validator = createValidator({ model, validation: {} })
		const result = await validator.validateCreate({
			entity: getEntity(model, 'Book'),
			data: {
				title: 'Hello',
			},
			overRelation: null,
			path: [],
			mapper,
		})
		expect(result).toEqual([
			{
				path: [
					{
						field: 'author',
					},
				],
				message: {
					text: 'Field is required',
				},
			},
		])
	})

	it('validates update', async () => {
		const model = new SchemaBuilder()
			.entity('Book', e => e.column('title', c => c.notNull().type(Model.ColumnType.String)).column('description'))
			.buildSchema()

		const validator = createValidator({
			model,
			validation: {
				Book: {
					description: [{ message: { text: 'Minimum length is 10 characters' }, validator: v.rules.minLength(10) }],
				},
			},
		})
		const result = await validator.validateUpdate({
			entity: getEntity(model, 'Book'),
			data: {
				description: 'World',
			},
			where: {},
			path: [],
			mapper,
		})
		expect(result).toEqual([
			{
				path: [
					{
						field: 'description',
					},
				],
				message: {
					text: 'Minimum length is 10 characters',
				},
			},
		])
	})

	it('validate update w dependent rules - invalid', async () => {
		const model = new SchemaBuilder()
			.entity('Book', e => e.column('title', c => c.notNull().type(Model.ColumnType.String)).column('description'))
			.buildSchema()

		const rule = v.rules.conditional(v.rules.on('title', v.rules.notEmpty()), v.rules.minLength(10))
		const validator = createValidator({
			model,
			validation: {
				Book: {
					description: [{ message: { text: 'Minimum length is 10 characters' }, validator: rule }],
				},
			},
			selects: [
				{
					entity: 'Book',
					where: { id: testUuid(1) },
					dependencies: { title: {} },
					result: { title: 'abcd' },
				},
			],
		})
		const result = await validator.validateUpdate({
			entity: getEntity(model, 'Book'),
			data: {
				description: 'World',
			},
			where: { id: testUuid(1) },
			path: [],
			mapper,
		})
		expect(result).toEqual([
			{
				path: [
					{
						field: 'description',
					},
				],
				message: {
					text: 'Minimum length is 10 characters',
				},
			},
		])
	})

	it('validate update w dependent rules - valid', async () => {
		const model = new SchemaBuilder()
			.entity('Book', e => e.column('title', c => c.notNull().type(Model.ColumnType.String)).column('description'))
			.buildSchema()

		const rule = v.rules.conditional(v.rules.on('title', v.rules.notEmpty()), v.rules.minLength(10))
		const validator = createValidator({
			model,
			validation: {
				Book: {
					description: [{ message: { text: 'Minimum length is 10 characters' }, validator: rule }],
				},
			},
			selects: [
				{
					entity: 'Book',
					where: { id: testUuid(1) },
					dependencies: { title: {} },
					result: { title: '' },
				},
			],
		})
		const result = await validator.validateUpdate({
			entity: getEntity(model, 'Book'),
			data: {
				description: 'World',
			},
			where: { id: testUuid(1) },
			path: [],
			mapper,
		})
		expect(result).toEqual([])
	})
})
