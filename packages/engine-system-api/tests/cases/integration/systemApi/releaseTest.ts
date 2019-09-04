import 'jasmine'
import { ApiTester, createRunMigrationEvent, EventSequence, GQL } from '@contember/engine-api-tester'
import { EventType } from '../../../../src/schema'

describe('system api - release', () => {
	it('executes release', async () => {
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

		await tester.content.queryContent(
			'preview',
			GQL`mutation {
				createAuthor(data: {name: "Jack Black"}) {
					ok
				}
			}`,
		)

		const diff = await tester.system.querySystem(GQL`query {
			diff(baseStage: "prod", headStage: "preview") {
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

		expect(diff.data.diff.result.events.length).toEqual(2)
		expect(diff.data.diff.result.events[0].type).toEqual('CREATE')
		expect(diff.data.diff.result.events[1].type).toEqual('CREATE')

		const result = await tester.system.querySystem(
			GQL`mutation ($baseStage: String!, $headStage: String!, $events: [String!]!) {
				release(baseStage: $baseStage, headStage: $headStage, events: $events) {
					ok
				}
			}`,
			{
				baseStage: 'prod',
				headStage: 'preview',
				events: [diff.data.diff.result.events[1].id],
			},
		)

		expect(result.data.release.ok).toEqual(true)

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

		const diff2 = await tester.system.diff('prod', 'preview')

		expect(diff2.events.length).toBe(1)
		expect(diff2.events[0].type).toBe(EventType.Create)
		await tester.cleanup()
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
			diff(baseStage: "a", headStage: "b") {
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

		expect(diff.data.diff.result.events.length).toBe(2)
		expect(diff.data.diff.result.events[0].type).toBe('CREATE')

		const result = await tester.system.querySystem(
			GQL`mutation ($baseStage: String!, $headStage: String!, $events: [String!]!) {
				release(baseStage: $baseStage, headStage: $headStage, events: $events) {
					ok
				}
			}`,
			{
				baseStage: 'a',
				headStage: 'b',
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
		await tester.cleanup()
	})
})
