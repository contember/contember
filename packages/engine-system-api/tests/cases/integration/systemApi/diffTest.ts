import 'jasmine'
import { ApiTester, GQL } from '@contember/engine-api-tester'
import { TIMEOUT } from '../../../src/constants'
import { VERSION_LATEST } from '@contember/schema-migrations'
import Acl from '@contember/schema/dist/src/schema/acl'
import SystemPermissionsLevel = Acl.SystemPermissionsLevel

describe('system api - diff', () => {
	it(
		'returns filtered diff',
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

			expect(diff.data.diff.result.events.length).toBe(2)
			expect(diff.data.diff.result.events[0].type).toBe('CREATE')

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

			expect(diffWithRelations.data.diff.result.events.length).toBe(3)
			expect(diffWithRelations.data.diff.result.events[0].type).toBe('CREATE')
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

			expect(diffAny.data.diff.result.events.length).toBe(1)

			await expectAsync(tester.system.querySystem(diffGql, { filter }, { roles: ['none'] })).toBeRejectedWithError(
				/You are not allowed to view a diff.+/,
			)

			await expectAsync(tester.system.querySystem(diffGql, {}, { roles: ['some'] })).toBeRejectedWithError(
				/You are not allowed to view a diff without specified filter.+/,
			)

			const diffSome = await tester.system.querySystem(diffGql, { filter }, { roles: ['any'] })
			expect(diffSome.data.diff.result.events.length).toBe(0)

			const diffSomeWithAcl = await tester.system.querySystem(diffGql, { filter }, { roles: ['someWithAcl'] })

			expect(diffSomeWithAcl.data.diff.result.events.length).toBe(1)

			await tester.cleanup()
		},
		TIMEOUT,
	)
})
