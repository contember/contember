import 'jasmine'
import { ApiTester, GQL } from '@contember/engine-api-tester'
import { TIMEOUT } from '../../../src/constants'
import Acl from '@contember/schema/dist/src/schema/acl'
import SystemPermissionsLevel = Acl.SystemPermissionsLevel
import { VERSION_LATEST } from '@contember/schema-migrations'

describe('system api - history', () => {
	it(
		'returns filtered history',
		async () => {
			const tester = await ApiTester.create({
				project: {
					stages: [
						{
							name: 'Prod',
							slug: 'prod',
						},
					],
				},
			})
			await tester.stages.createAll()
			await tester.stages.migrate('2019-02-01-163923')

			const response = await tester.content.queryContent(
				'prod',
				GQL`mutation {
          createAuthor(data: {name: "John Doe"}) {
              node {
                  id
              }
          }
      }`,
			)

			await tester.content.queryContent(
				'prod',
				GQL`mutation {
          updateAuthor(data: {name: "John The Doe"}, by: {id: "${response.createAuthor.node.id}"}) {
              node {
                  id
              }
          }
      }`,
			)

			await tester.content.queryContent(
				'prod',
				GQL`mutation {
          createAuthor(data: {name: "Jack Black"}) {
              ok
          }
      }`,
			)

			const history = await tester.system.querySystem(GQL`query {
			history(stage: "prod", filter: [{entity: "Author", id: "${response.createAuthor.node.id}"}]) {
				result {
					events {
						id
						description
						type
						identityDescription
					}
				}
			}
		}`)

			expect(history.data.history.result.events.length).toBe(2)
			expect(history.data.history.result.events[0].type).toBe('CREATE')
			expect(history.data.history.result.events[1].type).toBe('UPDATE')

			await tester.cleanup()
		},
		TIMEOUT,
	)
	it(
		'returns history with old values',
		async () => {
			const tester = await ApiTester.create({
				project: {
					stages: [
						{
							name: 'Prod',
							slug: 'prod',
						},
					],
				},
			})
			await tester.stages.createAll()
			await tester.stages.migrate('2019-02-01-163923')

			const response = await tester.content.queryContent(
				'prod',
				GQL`
					mutation {
						createAuthor(data: {name: "John Doe"}) {
							node {
								id
							}
						}
					}
				`,
			)

			await tester.content.queryContent(
				'prod',
				GQL`
					mutation {
						updateAuthor(by: {id: "${response.createAuthor.node.id}"}, data: {name: "Jack Black"}) {
							ok
						}
					}
				`,
			)

			await tester.content.queryContent(
				'prod',
				GQL`
					mutation {
						deleteAuthor(by: {id: "${response.createAuthor.node.id}"}) {
							ok
						}
					}
				`,
			)

			const history = await tester.system.querySystem(
				GQL`
					query {
						history(stage: "prod") {
							result {
								events {
									id
									type
									... on HistoryDeleteEvent {
										oldValues
									}
									... on HistoryUpdateEvent {
										oldValues
									}
								}
							}
						}
					}
				`,
			)

			expect(history.data.history.result.events.length).toBe(3)
			expect(history.data.history.result.events[0].type).toBe('CREATE')
			expect(history.data.history.result.events[1].type).toBe('UPDATE')
			expect(history.data.history.result.events[2].type).toBe('DELETE')
			expect(history.data.history.result.events[1].oldValues).toEqual({ name: 'John Doe' })
			expect(history.data.history.result.events[2].oldValues).toEqual({ name: 'Jack Black' })

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
										history: SystemPermissionsLevel.none,
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
										history: SystemPermissionsLevel.any,
									},
								},
							},
						],
					},
				],
			})

			const response = await tester.content.queryContent(
				'prod',
				GQL`mutation {
					createAuthor(data: {name: "John Doe"}) {
						node {
							id
						}
					}
				}`,
			)

			const filter = [{ entity: 'Author', id: response.createAuthor.node.id }]
			const historyGql = GQL`query($filter: [HistoryFilter!]) {
				history(stage: "prod", filter: $filter) {
					result {
						events {
							id
							description
							type
						}
					}
				}
			}`

			const historyAny = await tester.system.querySystem(historyGql, {}, { roles: ['any'] })

			expect(historyAny.data.history.result.events.length).toBe(1)

			await expectAsync(tester.system.querySystem(historyGql, { filter }, { roles: ['none'] })).toBeRejectedWithError(
				/You are not allowed to view a history.+/,
			)

			await tester.cleanup()
		},
		TIMEOUT,
	)
})
