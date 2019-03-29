import 'mocha'
import { testUuid } from '../../../src/testUuid'
import { ApiTester } from '../../../src/ApiTester'
import { GQL } from '../../../src/tags'
import { expect } from 'chai'

describe('system api - release', () => {
	it('executes release', async () => {
		const tester = await ApiTester.create()

		await tester.createStage({
			uuid: testUuid(1),
			name: 'Preview',
			slug: 'preview',
		})

		await tester.createStage({
			uuid: testUuid(2),
			name: 'Prod',
			slug: 'prod',
		})

		await tester.migrateStage('preview', '2019-02-01-163923-init')

		await tester.queryContent(
			'preview',
			GQL`mutation {
				createAuthor(data: {name: "John Doe"}) {
					id
				}
			}`
		)

		await tester.queryContent(
			'preview',
			GQL`mutation {
				createAuthor(data: {name: "Jack Black"}) {
					id
				}
			}`
		)

		const diff = await tester.querySystem(GQL`query {
			diff(baseStage: "${testUuid(2)}", headStage: "${testUuid(1)}") {
				result {
					events {
						id
						dependencies
						description
						allowed
						type
					}
				}
			}
		}`)

		expect(diff.data.diff.result.events).length(3)
		expect(diff.data.diff.result.events[0].type).eq('RUN_MIGRATION')
		expect(diff.data.diff.result.events[1].type).eq('CREATE')
		expect(diff.data.diff.result.events[2].type).eq('CREATE')

		const result = await tester.querySystem(
			GQL`mutation ($baseStage: String!, $headStage: String!, $events: [String!]!) {
				release(baseStage: $baseStage, headStage: $headStage, events: $events) {
					ok
				}
			}`,
			{
				baseStage: testUuid(2),
				headStage: testUuid(1),
				events: [diff.data.diff.result.events[0].id, diff.data.diff.result.events[2].id],
			}
		)

		expect(result.data.release.ok).eq(true)

		await tester.refreshStagesVersion()

		const authors = await tester.queryContent(
			'prod',
			GQL`query {
				listAuthor {
					name
				}
			}`
		)

		expect(authors).deep.eq({
			data: {
				listAuthor: [{ name: 'Jack Black' }],
			},
		})

		const diff2 = await tester.diff(testUuid(2), testUuid(1))

		expect(diff2.events).length(1)
		expect(diff2.events[0].type).eq('CREATE')
	})
})
