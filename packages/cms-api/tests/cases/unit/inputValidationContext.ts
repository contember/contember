import 'mocha'
import { expect } from 'chai'
import { Input, Model, Value } from 'cms-common'
import ValidationContextFactory from '../../../src/content-api/input-validation/ValidationContextFactory'
import schema from '../../example-project/src'
import ValidationDataSelector from '../../../src/content-api/input-validation/ValidationDataSelector'
import { createMock } from '../../../src/utils/testing'
import DependencyCollector from '../../../src/content-api/input-validation/DependencyCollector'
import { withMockedUuid } from '../../src/testUuid'
import DependencyPruner from '../../../src/content-api/input-validation/DependencyPruner'

type PrimaryValueExpectation = { entity: string; where: Input.UniqueWhere; result: Value.PrimaryValue }
type SelectExpectation = {
	entity: string
	where: Input.UniqueWhere
	dependencies: DependencyCollector.Dependencies
	result: Value.Object
}
const createDataSelectorMock = (primaryValues: PrimaryValueExpectation[], selects: SelectExpectation[]) => {
	return createMock<ValidationDataSelector>({
		getPrimaryValue: async (entity: Model.Entity, where: Input.UniqueWhere) => {
			const entry = primaryValues.shift()
			console.log(JSON.stringify({ entity: entity.name, where, result: undefined }))
			if (!entry) {
				throw new Error(`Unexpected getPrimaryValue call`)
			}
			expect(entity.name).eq(entry.entity)
			expect(where).deep.eq(entry.where)
			return entry.result
		},
		select: async (
			entity: Model.Entity,
			where: Input.UniqueWhere<never>,
			dependencies: DependencyCollector.Dependencies,
		) => {
			const entry = selects.shift()
			console.log(JSON.stringify({ entity: entity.name, where, dependencies, result: {} }))
			if (!entry) {
				throw new Error(`Unexpected select call`)
			}
			expect(entity.name).eq(entry.entity)
			expect(where).deep.eq(entry.where)
			console.log(JSON.stringify(entry))
			expect(dependencies).deep.eq(entry.dependencies)
			return entry.result
		},
	})
}

type Test = {
	entity: Model.Entity
	primaryValues?: PrimaryValueExpectation[]
	selects?: SelectExpectation[]
	dependencies: DependencyCollector.Dependencies
	result: any
} & (
	| {
			createInput: Input.CreateDataInput
	  }
	| {
			nodeInput: { node: Value.Object } | { where: Input.UniqueWhere }
			updateInput: Input.UpdateDataInput
	  })

const test = async (test: Test) => {
	const contextFactory = new ValidationContextFactory(
		schema.model,
		createDataSelectorMock(test.primaryValues || [], test.selects || []),
		new DependencyPruner(schema.model),
	)
	await withMockedUuid(async () => {
		if ('createInput' in test) {
			const result = await contextFactory.createForCreate(test.entity, test.createInput, test.dependencies)
			expect(result).deep.eq(test.result)
		} else {
			const result = await contextFactory.createForUpdate(
				test.entity,
				test.nodeInput,
				test.updateInput,
				test.dependencies,
			)
			expect(result).deep.eq(test.result)
		}
	})
}

describe('input validation context', () => {
	it('creates context for create', async () => {
		await test({
			entity: schema.model.entities.Author,
			selects: [
				{
					entity: 'Post',
					where: { id: 123 },
					dependencies: {
						title: {},
						tags: {
							label: {},
						},
					},
					result: { title: 'DB title', tags: [{ label: 'DB tag' }] },
				},
				{
					entity: 'Tag',
					where: { id: 456 },
					dependencies: {
						label: {},
					},
					result: { label: 'DB tag 2' },
				},
			],
			dependencies: {
				name: {},
				contact: { email: {} },
				posts: {
					title: {},
					tags: {
						label: {},
					},
				},
			},
			createInput: {
				name: 'Name input',
				contact: {
					create: { email: 'Email input' },
				},
				posts: [
					{ connect: { id: 123 } },
					{
						create: {
							title: 'Title input',
							tags: [{ connect: { id: 456 } }, { create: { label: 'Tag input' } }],
						},
					},
				],
			},

			result: {
				name: 'Name input',
				contact: {
					email: 'Email input',
				},
				posts: [
					{ title: 'DB title', tags: [{ label: 'DB tag' }] },
					{
						title: 'Title input',
						tags: [{ label: 'DB tag 2' }, { label: 'Tag input' }],
					},
				],
			},
		})
	})

	it('creates context for update', async () => {
		await test({
			entity: schema.model.entities.Author,
			selects: [
				{
					entity: 'Author',
					where: { id: 1 },
					dependencies: { name: {}, contact: { email: {} }, posts: { id: {}, title: {}, tags: { label: {} } } },
					result: {
						name: 'Db name',
						contact: {
							email: 'db email',
						},
						posts: [
							{
								id: 102,
								title: 'XXX',
							},
							{
								id: 103,
								title: 'DB title 103',
							},
							{
								id: 105,
								title: 'DB title 105',
							},
						],
					},
				},
				{
					entity: 'Post',
					where: { id: 101 },
					dependencies: { id: {}, title: {}, tags: { label: {} } },
					result: {
						id: 101,
						title: 'DB title 101',
					},
				},
				{
					entity: 'Tag',
					where: { id: 201 },
					dependencies: { label: {} },
					result: {
						label: 'DB label 201',
					},
				},
				{
					entity: 'Post',
					where: { id: 103 },
					dependencies: { id: {}, title: {}, tags: { label: {} } },
					result: {
						id: 103,
						title: 'DB title 103',
						tags: [],
					},
				},
			],
			primaryValues: [
				{ entity: 'Post', where: { id: 102 }, result: 102 },
				{ entity: 'Post', where: { id: 103 }, result: 103 },
			],
			dependencies: {
				name: {},
				contact: { email: {} },
				posts: {
					id: {},
					title: {},
					tags: {
						label: {},
					},
				},
			},
			nodeInput: {
				where: { id: 1 },
			},
			updateInput: {
				name: 'Name input',
				contact: {
					update: { email: 'Email input' },
				},
				posts: [
					{ connect: { id: 101 } },
					{ disconnect: { id: 102 } },
					{
						create: {
							title: 'Title input',
							tags: [{ connect: { id: 201 } }, { create: { label: 'Tag input' } }],
						},
					},
					{
						update: {
							by: { id: 103 },
							data: { title: 'Update post' },
						},
					},
				],
			},

			result: {
				contact: {
					email: 'Email input',
				},
				name: 'Name input',
				posts: [
					{
						id: 105,
						title: 'DB title 105',
					},
					{
						id: 101,
						title: 'DB title 101',
					},
					{
						id: 103,
						tags: [],
						title: 'Update post',
					},
					{
						id: '00000000-0000-0000-0000-000000000000',
						tags: [
							{
								label: 'DB label 201',
							},
							{
								label: 'Tag input',
							},
						],
						title: 'Title input',
					},
				],
			},
		})
	})
})
