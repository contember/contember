import 'jasmine'
import { ApiTester, createRunMigrationEvent, EventSequence, GQL } from '@contember/engine-api-tester'
import { DiffEventType } from '../../../../src/schema'
import { TIMEOUT } from '../../../src/constants'
import Acl from '@contember/schema/dist/src/schema/acl'
import SystemPermissionsLevel = Acl.SystemPermissionsLevel
import { VERSION_LATEST } from '@contember/schema-migrations'

describe('system api - releaseTree', () => {
	it(
		'executes tree release',
		async () => {
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

			expect(result.data.releaseTree.ok).toEqual(true)

			const authors = await tester.content.queryContent(
				'prod',
				GQL`query {
				listAuthor {
					name
				}
			}`,
			)

			expect(authors).toEqual({
				listAuthor: [{ name: 'Jack Black' }],
			})

			const diff2 = await tester.system.diff('preview')

			expect(diff2.events.length).toBe(1)
			expect(diff2.events[0].type).toBe(DiffEventType.Create)
			await tester.cleanup()
		},
		TIMEOUT,
	)

	it(
		'works with acl',
		async () => {
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

			await expectAsync(tester.system.querySystem(releaseGql, { filter }, { roles: ['none'] })).toBeRejectedWithError(
				/You are not allowed to execute a release.+/,
			)

			const releaseSome = await tester.system.querySystem(releaseGql, { filter }, { roles: ['some'] })

			expect(releaseSome.data.releaseTree.ok).toBeFalse()
			expect(releaseSome.data.releaseTree.errors.length).toBe(1)
			expect(releaseSome.data.releaseTree.errors[0]).toBe('FORBIDDEN')

			const releaseSomeWithAcl = await tester.system.querySystem(releaseGql, { filter }, { roles: ['someWithAcl'] })

			expect(releaseSomeWithAcl.data.releaseTree.ok).toBeTrue()

			await tester.cleanup()
		},
		TIMEOUT,
	)
})
