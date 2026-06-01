import { ActionsDefinition as actions, createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { expect, test } from 'bun:test'
import { createTester, gql } from '../../src/tester.js'

namespace ActionsModel {
	@actions.watch({
		name: 'article_watch',
		watch: `
			title
		`,
		webhook: 'http://foobar',
		selection: `
			title
		`,
	})
	export class Article {
		title = def.stringColumn().unique()
	}
}

test('triggers: return ids in response extensions when enabled', async () => {
	const schema = createSchema(ActionsModel, schema => ({
		...schema,
		settings: {
			...schema.settings,
			actions: { returnTriggeredActions: true },
		},
	}))
	const tester = await createTester(schema)

	const res = await tester(
		gql`
			mutation {
				createArticle(data: { title: "Hello world" }) {
					ok
					node { id }
				}
			}
		`,
		{ keepExtensions: true },
	).expect(200)

	const triggered = res.body.extensions?.triggeredActions
	expect(triggered).toBeDefined()
	expect(triggered.events).toBeArrayOfSize(1)
	const event = triggered.events[0]
	expect(event.id).toMatch(/^[0-9a-f-]{36}$/)
	expect(event.transactionId).toMatch(/^[0-9a-f-]{36}$/)
	expect(event.trigger).toBe('article_watch')
	expect(event.target).toBe('article_watch_target')
})

test('triggers: return ids omits extension when no actions fire', async () => {
	const schema = createSchema(ActionsModel, schema => ({
		...schema,
		settings: {
			...schema.settings,
			actions: { returnTriggeredActions: true },
		},
	}))
	const tester = await createTester(schema)

	const res = await tester(
		gql`
			query {
				listArticle { id }
			}
		`,
		{ keepExtensions: true },
	).expect(200)

	expect(res.body.extensions?.triggeredActions).toBeUndefined()
})

test('triggers: return ids disabled by default', async () => {
	const schema = createSchema(ActionsModel)
	const tester = await createTester(schema)

	const res = await tester(
		gql`
			mutation {
				createArticle(data: { title: "Hello world" }) {
					ok
					node { id }
				}
			}
		`,
		{ keepExtensions: true },
	).expect(200)

	expect(res.body.extensions?.triggeredActions).toBeUndefined()
})
