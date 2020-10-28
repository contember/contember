import { ApiTester, GQL } from '@contember/engine-api-tester'
import { Acl } from '@contember/schema'
import SystemPermissionsLevel = Acl.SystemPermissionsLevel
import { VERSION_LATEST } from '@contember/schema-migrations'
import { suite } from 'uvu'
import * as assert from '../../../src/asserts'

const historyTest = suite('System API - history')

historyTest('get filtered history', async () => {
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

	assert.is(history.data.history.result.events.length, 2)
	assert.is(history.data.history.result.events[0].type, 'CREATE')
	assert.is(history.data.history.result.events[1].type, 'UPDATE')

	await tester.cleanup()
})
historyTest('get history with old values', async () => {
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

	assert.is(history.data.history.result.events.length, 3)
	assert.is(history.data.history.result.events[0].type, 'CREATE')
	assert.is(history.data.history.result.events[1].type, 'UPDATE')
	assert.is(history.data.history.result.events[2].type, 'DELETE')
	assert.equal(history.data.history.result.events[1].oldValues, { name: 'John Doe' })
	assert.equal(history.data.history.result.events[2].oldValues, { name: 'Jack Black' })

	await tester.cleanup()
})

historyTest('check ACL works', async () => {
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

	assert.is(historyAny.data.history.result.events.length, 1)

	await assert.throwsAsync(
		tester.system.querySystem(historyGql, { filter }, { roles: ['none'] }),
		/You are not allowed to view a history.+/,
	)

	await tester.cleanup()
})
historyTest.run()
