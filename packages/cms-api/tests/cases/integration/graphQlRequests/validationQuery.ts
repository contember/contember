import { execute, SqlQuery } from '../../../src/test'
import { GQL } from '../../../src/tags'
import 'mocha'
import schema from '../../../example-project/src'
import { testUuid } from '../../../src/testUuid'
import { Input, Result } from '@contember/schema'

interface CreateTest {
	entity: string
	executes?: SqlQuery[]
	data: Input.CreateDataInput
	errors: string[] | Result.ValidationError[]
}

const testCreate = async (test: CreateTest) => {
	const simplifiedErrors = test.errors.length === 0 || typeof test.errors[0] === 'string'
	return await execute({
		schema: schema.model,
		validation: schema.validation,
		executes: test.executes || [],
		query: GQL`query($data: ${test.entity}CreateInput!) {
					result: validateCreate${test.entity}(data: $data) {
							${simplifiedErrors ? simplifiedValidationGqlPart : validationGqlPart}
					}
			}`,
		queryVariables: { data: test.data },
		return: {
			data: {
				result: {
					errors: (test.errors as any).map((it: string | Result.ValidationError) =>
						typeof it === 'string' ? { message: { text: it } } : it,
					),
					valid: test.errors.length === 0,
				},
			},
		},
	})
}

interface UpdateTest {
	entity: string
	executes?: SqlQuery[]
	by: Input.UniqueWhere
	data: Input.UpdateDataInput
	errors: string[] | Result.ValidationError[]
}

const testUpdate = async (test: UpdateTest) => {
	const simplifiedErrors = test.errors.length === 0 || typeof test.errors[0] === 'string'

	return await execute({
		schema: schema.model,
		validation: schema.validation,
		executes: test.executes || [],
		query: GQL`query($data: ${test.entity}UpdateInput!, $by: ${test.entity}UniqueWhere!) {
					result: validateUpdate${test.entity}(data: $data, by: $by) {
							${simplifiedErrors ? simplifiedValidationGqlPart : validationGqlPart}
					}
			}`,
		queryVariables: { data: test.data, by: test.by },
		return: {
			data: {
				result: {
					errors: (test.errors as any).map((it: string | Result.ValidationError) =>
						typeof it === 'string' ? { message: { text: it } } : it,
					),
					valid: test.errors.length === 0,
				},
			},
		},
	})
}

const simplifiedValidationGqlPart = `
valid
errors {
    message {
        text
    }
}`
const validationGqlPart = `
valid
errors {
    message {
        text
    }
    path {
        ... on _IndexPathFragment {
            index
            alias
        }
        ... on _FieldPathFragment {
            field
        }
    }    
}`

describe('Create validation queries', () => {
	it('Validate create author #1', async () => {
		await testCreate({
			entity: 'Author',
			data: {},
			errors: ['Author name is required', 'Contact is required'],
		})
	})

	it('Validate create contact - empty email', async () => {
		await testCreate({
			entity: 'AuthorContact',
			data: {},
			errors: ['Contact e-mail is required'],
		})
	})
	it('Validate create contact - invalid email', async () => {
		await testCreate({
			entity: 'AuthorContact',
			data: { email: 'aaa' },
			errors: ['E-mail is invalid'],
		})
	})

	it('Validate create contact - ok', async () => {
		await testCreate({
			entity: 'AuthorContact',
			data: { email: 'aaa@bb.cz' },
			errors: [],
		})
	})

	it('Validate create post #1', async () => {
		await testCreate({
			entity: 'Post',
			data: { title: 'Abc', content: 'Xyz' },
			errors: ['Post author is required', 'Post tags are required'],
		})
	})

	it('Validate create post #2', async () => {
		await testCreate({
			entity: 'Post',
			data: {
				title: 'Abc',
				content: 'Xyz',
				author: { connect: { id: testUuid(1) } },
				tags: [{ create: { label: 'test' } }],
			},
			executes: [
				{
					sql: 'select "root_"."id" as "root_id" from "public"."author" as "root_" where "root_"."id" = ?',
					parameters: [testUuid(1)],
					response: {
						rows: [{ root_id: testUuid(1) }],
					},
				},
			],
			errors: ['Please fill at least two tags'],
		})
	})

	it('Validate create post #3', async () => {
		await testCreate({
			entity: 'Post',
			data: {
				title: 'Abc',
				content: 'Xyz',
				author: { connect: { id: testUuid(1) } },
				tags: [{ create: { label: 'test' } }, { connect: { id: testUuid(2) } }],
			},
			executes: [
				{
					sql: 'select "root_"."id" as "root_id" from  "public"."author" as "root_"   where "root_"."id" = ?',
					parameters: [testUuid(1)],
					response: {
						rows: [{ root_id: testUuid(1) }],
					},
				},
				{
					sql: 'select "root_"."id" as "root_id" from  "public"."tag" as "root_"   where "root_"."id" = ?',
					parameters: [testUuid(2)],
					response: {
						rows: [{ root_id: testUuid(2) }],
					},
				},
			],
			errors: [],
		})
	})

	it('Validate with alias', async () => {
		await testCreate({
			entity: 'Post',
			data: {
				title: 'Abc',
				content: 'Xyz',
				author: { connect: { id: testUuid(1) } },
				tags: [{ alias: 'foo', create: { label: '' } }],
			},
			executes: [
				{
					sql: 'select "root_"."id" as "root_id" from  "public"."author" as "root_"   where "root_"."id" = ?',
					parameters: [testUuid(1)],
					response: {
						rows: [{ root_id: testUuid(1) }],
					},
				},
			],
			errors: [
				{
					message: {
						text: 'Please fill at least two tags',
					},
					path: [
						{
							field: 'tags',
						},
					],
				},
				{
					message: {
						text: 'Tag label is required',
					},
					path: [
						{
							field: 'tags',
						},
						{
							index: 0,
							alias: 'foo',
						},
						{
							field: 'label',
						},
					],
				},
			],
		})
	})
})

describe('Update validation queries', () => {
	it('update author #1', async () => {
		await testUpdate({
			entity: 'Author',
			data: {},
			by: { id: testUuid(1) },
			errors: [],
		})
	})
	it('update author #2', async () => {
		await testUpdate({
			entity: 'Author',
			executes: [
				{
					sql:
						'select "root_"."name" as "root_name", "root_"."id" as "root_id" from "public"."author" as "root_" where "root_"."id" = ?',
					parameters: [testUuid(1)],
					response: {
						rows: [{ name: 'Test', root_id: testUuid(1) }],
					},
				},
			],
			data: { name: '' },
			by: { id: testUuid(1) },
			errors: ['Author name is required'],
		})
	})

	it('update post', async () => {
		await testUpdate({
			entity: 'Post',
			executes: [
				{
					sql:
						'select "root_"."id" as "root_id", "root_"."id" as "root_id" from "public"."post" as "root_" where "root_"."id" = ?',
					parameters: [testUuid(1)],
					response: {
						rows: [{ root_id: testUuid(1) }],
					},
				},
				{
					sql: `select "junction_"."tag_id", "junction_"."post_id" from  "public"."post_tags" as "junction_"   where "junction_"."post_id" in (?)`,
					parameters: [testUuid(1)],
					response: {
						rows: [{ post_id: testUuid(1), tag_id: testUuid(10) }, { post_id: testUuid(1), tag_id: testUuid(11) }],
					},
				},
				{
					sql: `select "root_"."id" as "root_id" from  "public"."tag" as "root_"   where "root_"."id" in (?, ?)`,
					parameters: [testUuid(10), testUuid(11)],
					response: { rows: [{ root_id: testUuid(10) }, { root_id: testUuid(11) }] },
				},
			],
			by: { id: testUuid(1) },
			data: { tags: [{ disconnect: { id: testUuid(10) } }] },
			errors: ['Please fill at least two tags'],
		})
	})

	it('update post with alias on many update', async () => {
		await testUpdate({
			entity: 'Post',
			executes: [
				{
					sql:
						'select "root_"."id" as "root_id", "root_"."id" as "root_id" from "public"."post" as "root_" where "root_"."id" = ?',
					parameters: [testUuid(1)],
					response: {
						rows: [{ root_id: testUuid(1) }],
					},
				},
				{
					sql: `select "junction_"."tag_id", "junction_"."post_id" from  "public"."post_tags" as "junction_"   where "junction_"."post_id" in (?)`,
					parameters: [testUuid(1)],
					response: {
						rows: [{ post_id: testUuid(1), tag_id: testUuid(10) }, { post_id: testUuid(1), tag_id: testUuid(11) }],
					},
				},
				{
					sql: `select "root_"."id" as "root_id" from  "public"."tag" as "root_"   where "root_"."id" in (?, ?)`,
					parameters: [testUuid(10), testUuid(11)],
					response: { rows: [{ root_id: testUuid(10) }, { root_id: testUuid(11) }] },
				},
			],
			by: { id: testUuid(1) },
			data: { tags: [{ alias: 'foo', create: { label: '' } }] },
			errors: [
				{
					message: {
						text: 'Tag label is required',
					},
					path: [
						{
							field: 'tags',
						},
						{
							index: 0,
							alias: 'foo',
						},
						{
							field: 'label',
						},
					],
				},
			],
		})
	})
})
