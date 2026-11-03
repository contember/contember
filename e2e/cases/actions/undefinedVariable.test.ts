import { ActionsDefinition as actions, createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { expect, test } from 'bun:test'
import { createTester, executeGraphql, gql } from '../../src/tester.js'

namespace UndefinedVariableModel {
	@actions.watch({
		name: 'article_watch',
		watch: `
			title
		`,
		webhook: {
			// nothing listens on the discard port: once the variable is set, the delivery attempt fails fast
			url: 'http://127.0.0.1:9/{{E2E_UNDEFINED_PATH}}',
			headers: { Authorization: 'Bearer {{E2E_UNDEFINED_TOKEN}}' },
		},
	})
	export class Article {
		title = def.stringColumn()
	}
}

type EventState = {
	state: string
	numRetries: number
	visibleAt: string
	log: { errorMessage?: string; undefinedVariables?: string[] }[]
}

test('actions: an undefined variable holds the event back without spending attempts, setting it resumes delivery', async () => {
	const schema = createSchema(UndefinedVariableModel, schema => ({
		...schema,
		settings: { ...schema.settings, actions: { returnTriggeredActions: true } },
	}))
	const tester = await createTester(schema)
	const actionsPath = '/actions/' + tester.projectSlug

	const createArticle = async (): Promise<string> => {
		const created = await tester(
			gql`
				mutation {
					createArticle(data: { title: "Hello" }) {
						ok
					}
				}
			`,
			{ keepExtensions: true },
		).expect(200)
		return created.body.extensions.triggeredActions.events[0].id
	}
	// the target sends one event per request, so a single check must hold the other queued event too
	const eventId = await createArticle()
	const otherEventId = await createArticle()

	const processBatch = async () => {
		await executeGraphql(
			actionsPath,
			gql`
			mutation {
				processBatch {
					ok
				}
			}
		`,
			{},
		).expect(200)
	}
	const fetchEvent = async (id: string): Promise<EventState> => {
		const res = await executeGraphql(actionsPath, `query($id: UUID!) { event(id: $id) { state numRetries visibleAt log } }`, {
			variables: { id },
		}).expect(200)
		return res.body.data.event
	}
	// a dispatch worker running alongside may hold the event in processing for a moment
	const fetchSettledEvent = async (id = eventId): Promise<EventState> => {
		for (let i = 0; i < 50; i++) {
			const event = await fetchEvent(id)
			if (event.state !== 'processing') {
				return event
			}
			await new Promise(resolve => setTimeout(resolve, 100))
		}
		throw new Error('The event stayed in processing')
	}

	const setVariable = async (name: string, value: string) => {
		await executeGraphql(actionsPath, `mutation($variables: [VariableInput!]!) { setVariables(args: { variables: $variables }) { ok } }`, {
			variables: { variables: [{ name, value }] },
		}).expect(200)
	}

	await processBatch()
	const held = await fetchSettledEvent()
	expect(held.state).toBe('created')
	expect(held.numRetries).toBe(0)
	expect(new Date(held.visibleAt).getTime()).toBeGreaterThan(Date.now() + 60_000)
	expect(held.log).toStrictEqual([{
		ok: false,
		errorMessage: 'Undefined variable E2E_UNDEFINED_PATH, E2E_UNDEFINED_TOKEN',
		undefinedVariables: ['E2E_UNDEFINED_PATH', 'E2E_UNDEFINED_TOKEN'],
	}])
	const otherHeld = await fetchSettledEvent(otherEventId)
	expect(otherHeld.state).toBe('created')
	expect(otherHeld.visibleAt).toBe(held.visibleAt)
	expect(otherHeld.log).toStrictEqual(held.log)

	// an event arriving meanwhile joins the hold and leaves the events already held untouched
	const joinedEventId = await createArticle()
	await processBatch()
	const joined = await fetchSettledEvent(joinedEventId)
	expect(joined.state).toBe('created')
	expect(joined.numRetries).toBe(0)
	expect(joined.visibleAt).toBe(held.visibleAt)
	expect(await fetchSettledEvent()).toStrictEqual(held)

	// one of the two is still missing: the event stays held and no attempt is spent
	await setVariable('E2E_UNDEFINED_PATH', 'hook')
	await processBatch()
	const stillHeld = await fetchSettledEvent()
	expect(stillHeld.state).toBe('created')
	expect(stillHeld.numRetries).toBe(0)
	expect(stillHeld.log.map(it => it.undefinedVariables)).toStrictEqual([
		['E2E_UNDEFINED_PATH', 'E2E_UNDEFINED_TOKEN'],
		['E2E_UNDEFINED_TOKEN'],
	])

	// a re-check that finds the same variable missing does not grow the log
	await setVariable('E2E_UNDEFINED_PATH', 'hook')
	await processBatch()
	const rechecked = await fetchSettledEvent()
	expect(new Date(rechecked.visibleAt).getTime()).toBeGreaterThan(new Date(stillHeld.visibleAt).getTime())
	expect(rechecked.log).toHaveLength(2)

	await setVariable('E2E_UNDEFINED_TOKEN', 'secret')
	// one event per batch: three batches deliver the three released events
	for (let i = 0; i < 3; i++) {
		await processBatch()
	}
	for (const id of [eventId, otherEventId, joinedEventId]) {
		const attempted = await fetchSettledEvent(id)
		expect(attempted.state).toBe('retrying')
		expect(attempted.numRetries).toBe(1)
		expect(attempted.log.at(-1)?.undefinedVariables).toBeUndefined()
	}
})
