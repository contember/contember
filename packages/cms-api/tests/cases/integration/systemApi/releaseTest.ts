import 'mocha'
import { testUuid } from '../../../src/testUuid'
import ApiTester from '../../../src/ApiTester'
import { GQL } from '../../../src/tags'
import { expect } from 'chai'
import { createRunMigrationEvent } from '../../../src/DummyEventFactory'
import EventSequence from '../../../src/EventSequence'

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

		await tester.content.queryContent(
			'preview',
			GQL`mutation {
				createAuthor(data: {name: "Jack Black"}) {
					ok
				}
			}`,
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
			},
		)

		expect(result.data.release.ok).eq(true)

		const authors = await tester.content.queryContent(
			'prod',
			GQL`query {
				listAuthor {
					name
				}
			}`,
		)

		expect(authors).deep.eq({
			listAuthor: [{ name: 'Jack Black' }],
		})

		const diff2 = await tester.system.diff(testUuid(2), testUuid(1))

		expect(diff2.events).length(1)
		expect(diff2.events[0].type).eq('CREATE')
	})

	it('executes rebase after release', async () => {
		const eventsSequence = {
			a: '  1 2 3',
			b: 'a - - - 4 5',
			c: 'b - - - - - 6',
			d: 'b - - - - - 7',
			e: 'd - - - - - 8',
		}

		const stages = EventSequence.createStagesConfiguration(eventsSequence)
		const tester = await ApiTester.create({
			project: {
				stages: stages,
			},
		})
		await tester.stages.createAll()

		await tester.stages.migrate('2019-02-01-163923-init')

		await tester.sequences.runSequence(eventsSequence)

		const diff = await tester.system.querySystem(GQL`query {
			diff(baseStage: "${testUuid(1)}", headStage: "${testUuid(2)}") {
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

		const result = await tester.system.querySystem(
			GQL`mutation ($baseStage: String!, $headStage: String!, $events: [String!]!) {
				release(baseStage: $baseStage, headStage: $headStage, events: $events) {
					ok
				}
			}`,
			{
				baseStage: testUuid(1),
				headStage: testUuid(2),
				events: [diff.data.diff.result.events[1].id],
			},
		)

		await tester.sequences.verifySequence(
			{
				a: '  99 1 2 3 5',
				b: 'a -  - - - - 4',
				c: 'b -  - - - - - 6',
				d: 'b -  - - - - - 7',
				e: 'd -  - - - - - - 8',
			},
			{
				99: createRunMigrationEvent('2019-02-01-163923'),
			},
		)
	})
})
