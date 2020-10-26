import { ApiTester, GQL } from '@contember/engine-api-tester'
import { VERSION_LATEST } from '@contember/schema-migrations'
import { Acl } from '@contember/schema'
import SystemPermissionsLevel = Acl.SystemPermissionsLevel
import { suite } from 'uvu'
import * as assert from '../../../src/asserts'

const diffTest = suite('System API - diff')

diffTest('get filtered diff', async () => {
	const tester = await ApiTester.create({
		project: {
			stages: [
				{
					name: 'Prod',
					slug: 'prod',
				},
				{
					name: 'Preview',
					slug: 'preview',
					base: 'prod',
				},
			],
		},
	})
	await tester.stages.createAll()
	await tester.stages.migrate('2019-02-01-163923')
	await tester.stages.migrate('2019-11-04-130244')

	const response = await tester.content.queryContent(
		'preview',
		GQL`mutation {
					createAuthor(data: {name: "John Doe", contact: {create: {email: "john@example.org"}}}) {
						node {
							id
						}
					}
				}`,
	)

	await tester.content.queryContent(
		'preview',
		GQL`mutation($author: UUID!) {
					createPost(data: {title: "abc", content: "xyz", author: {connect: {id: $author}}}) {
						ok
					}
				}`,
		{ author: response.createAuthor.node.id },
	)

	await tester.content.queryContent(
		'preview',
		GQL`mutation {
					createAuthor(data: {name: "Jack Black", contact: {create: {email: "jack@example.org"}}}) {
						ok
					}
				}`,
	)

	const diff = await tester.system.querySystem(GQL`query {
			diff(stage: "preview", filter: [{entity: "Author", id: "${response.createAuthor.node.id}"}]) {
				result {
					events {
						id
						dependencies
						description
						type
					}
				}
			}
		}`)

	assert.is(diff.data.diff.result.events.length, 2)
	assert.is(diff.data.diff.result.events[0].type, 'CREATE')

	const diffWithRelations = await tester.system.querySystem(GQL`query {
			diff(stage: "preview", filter: [{entity: "Author", id: "${response.createAuthor.node.id}", relations: [{name: "posts", relations: []}]}]) {
				result {
					events {
						id
						dependencies
						description
						type
					}
				}
			}
		}`)

	assert.is(diffWithRelations.data.diff.result.events.length, 3)
	assert.is(diffWithRelations.data.diff.result.events[0].type, 'CREATE')
	await tester.cleanup()
})

diffTest('check ACL', async () => {
	const tester = await ApiTester.create({
		project: {
			stages: [
				{
					name: 'Prod',
					slug: 'prod',
				},
				{
					name: 'Preview',
					slug: 'preview',
					base: 'prod',
				},
			],
		},
	})
	await tester.stages.createAll()
	await tester.stages.migrate('2019-02-01-163923')
	await tester.stages.migrate({
		formatVersion: VERSION_LATEST,
		name: 'acl',
		version: '2020-02-01-163923',
		modifications: [
			{
				modification: 'patchAclSchema',
				patch: [
					{
						op: 'add',
						path: '/roles/none',
						value: {
							variables: {},
							stages: '*',
							entities: {},
							system: {
								diff: SystemPermissionsLevel.none,
							},
						},
					},
					{
						op: 'add',
						path: '/roles/some',
						value: {
							variables: {},
							stages: '*',
							entities: {},
							system: {
								diff: SystemPermissionsLevel.some,
							},
						},
					},
					{
						op: 'add',
						path: '/roles/someWithAcl',
						value: {
							variables: {},
							stages: '*',
							entities: {
								Author: {
									predicates: {},
									operations: {
										read: {
											name: true,
										},
									},
								},
							},
							system: {
								diff: SystemPermissionsLevel.some,
							},
						},
					},
					{
						op: 'add',
						path: '/roles/any',
						value: {
							variables: {},
							stages: '*',
							entities: {},
							system: {
								diff: SystemPermissionsLevel.any,
							},
						},
					},
				],
			},
		],
	})

	const response = await tester.content.queryContent(
		'preview',
		GQL`mutation {
					createAuthor(data: {name: "John Doe"}) {
						node {
							id
						}
					}
				}`,
	)

	const filter = [{ entity: 'Author', id: response.createAuthor.node.id }]
	const diffGql = GQL`query($filter: [TreeFilter!]) {
				diff(stage: "preview", filter: $filter) {
					result {
						events {
							id
							dependencies
							description
							type
						}
					}
				}
			}`

	const diffAny = await tester.system.querySystem(diffGql, {}, { roles: ['any'] })

	assert.is(diffAny.data.diff.result.events.length, 1)

	await assert.throwsAsync(
		tester.system.querySystem(diffGql, { filter }, { roles: ['none'] }),
		/You are not allowed to view a diff.+/,
	)

	await assert.throwsAsync(
		tester.system.querySystem(diffGql, {}, { roles: ['some'] }),
		/You are not allowed to view a diff without specified filter.+/,
	)

	const diffSome = await tester.system.querySystem(diffGql, { filter }, { roles: ['any'] })
	assert.is(diffSome.data.diff.result.events.length, 0)

	const diffSomeWithAcl = await tester.system.querySystem(diffGql, { filter }, { roles: ['someWithAcl'] })

	assert.is(diffSomeWithAcl.data.diff.result.events.length, 1)

	await tester.cleanup()
})
