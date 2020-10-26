import { ApiTester, GQL } from '@contember/engine-api-tester'
import { DiffEventType } from '../../../../src/schema'
import { Acl } from '@contember/schema'
import { VERSION_LATEST } from '@contember/schema-migrations'
import { suite } from 'uvu'
import * as assert from '../../../src/asserts'
import SystemPermissionsLevel = Acl.SystemPermissionsLevel

const releaseTreeTest = suite('system API - releaseTree')
releaseTreeTest('execute tree release', async () => {
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

	await tester.stages.migrate('2019-02-01-163923-init')

	await tester.content.queryContent(
		'preview',
		GQL`mutation {
				createAuthor(data: {name: "John Doe"}) {
					ok
				}
			}`,
	)

	const authorResult = await tester.content.queryContent(
		'preview',
		GQL`mutation {
				createAuthor(data: {name: "Jack Black"}) {
					ok
					node {
						id
					}
				}
			}`,
	)

	const result = await tester.system.querySystem(
		GQL`mutation ($stage: String!, $filter: [TreeFilter!]!) {
				releaseTree(stage: $stage, tree: $filter) {
					ok
				}
			}`,
		{
			stage: 'preview',
			filter: [{ entity: 'Author', id: authorResult.createAuthor.node.id }],
		},
	)

	assert.ok(result.data.releaseTree.ok)

	const authors = await tester.content.queryContent(
		'prod',
		GQL`query {
				listAuthor {
					name
				}
			}`,
	)

	assert.equal(authors, {
		listAuthor: [{ name: 'Jack Black' }],
	})

	const diff2 = await tester.system.diff('preview')

	assert.is(diff2.events.length, 1)
	assert.is(diff2.events[0].type, DiffEventType.Create)
	await tester.cleanup()
})

releaseTreeTest('check that ACL rules works', async () => {
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
								release: SystemPermissionsLevel.none,
							},
						},
					},
					{
						op: 'add',
						path: '/roles/some',
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
								release: SystemPermissionsLevel.some,
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
										create: {
											name: true,
										},
										read: {
											name: true,
										},
									},
								},
							},
							system: {
								release: SystemPermissionsLevel.some,
							},
						},
					},
				],
			},
		],
	})

	const authorResult = await tester.content.queryContent(
		'preview',
		GQL`mutation {
					createAuthor(data: {name: "Jack Black"}) {
						ok
						node {
							id
						}
					}
				}`,
	)

	const filter = [{ entity: 'Author', id: authorResult.createAuthor.node.id }]
	const releaseGql = GQL`mutation ($filter: [TreeFilter!]!) {
				releaseTree(stage: "preview", tree: $filter) {
					ok
					errors
				}
			}`

	await assert.throwsAsync(
		tester.system.querySystem(releaseGql, { filter }, { roles: ['none'] }),
		/You are not allowed to execute a release.+/,
	)

	const releaseSome = await tester.system.querySystem(releaseGql, { filter }, { roles: ['some'] })

	assert.not.ok(releaseSome.data.releaseTree.ok)
	assert.is(releaseSome.data.releaseTree.errors.length, 1)
	assert.is(releaseSome.data.releaseTree.errors[0], 'FORBIDDEN')

	const releaseSomeWithAcl = await tester.system.querySystem(releaseGql, { filter }, { roles: ['someWithAcl'] })

	assert.ok(releaseSomeWithAcl.data.releaseTree.ok)

	await tester.cleanup()
})

releaseTreeTest.run()
