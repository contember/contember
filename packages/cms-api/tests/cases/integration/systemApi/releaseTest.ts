import 'mocha'
import { testUuid } from '../../../src/testUuid'
import ApiTester from '../../../src/ApiTester'
import { GQL } from '../../../src/tags'
import { expect } from 'chai'

describe('system api - release', () => {
	it('executes release', async () => {
		const tester = await ApiTester.create({
			project: {
				stages: [
					{
						id: testUuid(2),
						name: 'Prod',
						slug: 'prod',
					},
					{
						id: testUuid(1),
						name: 'Preview',
						slug: 'preview',
						rebaseOn: 'prod',
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
					id
				}
			}`
		)

		await tester.content.queryContent(
			'preview',
			GQL`mutation {
				createAuthor(data: {name: "Jack Black"}) {
					id
				}
			}`
		)

		const diff = await tester.system.querySystem(GQL`query {
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

		expect(diff.data.diff.result.events).length(2)
		expect(diff.data.diff.result.events[0].type).eq('CREATE')
		expect(diff.data.diff.result.events[1].type).eq('CREATE')

		const result = await tester.system.querySystem(
			GQL`mutation ($baseStage: String!, $headStage: String!, $events: [String!]!) {
				release(baseStage: $baseStage, headStage: $headStage, events: $events) {
					ok
				}
			}`,
			{
				baseStage: testUuid(2),
				headStage: testUuid(1),
				events: [diff.data.diff.result.events[1].id],
			}
		)

		expect(result.data.release.ok).eq(true)

		const authors = await tester.content.queryContent(
			'prod',
			GQL`query {
				listAuthor {
					name
				}
			}`
		)

		expect(authors).deep.eq({
			listAuthor: [{ name: 'Jack Black' }],
		})

		const diff2 = await tester.system.diff(testUuid(2), testUuid(1))

		expect(diff2.events).length(1)
		expect(diff2.events[0].type).eq('CREATE')
	})
})
