import { GraphQLListener } from '../graphql/index.js'
import { ContentGraphqlContext } from './ContentGraphqlContext.js'

export const createTriggeredActionsListener = (): GraphQLListener<ContentGraphqlContext> => ({
	onResponse: ({ response, context }) => {
		const collector = context.executionContainer.triggeredActionsCollector
		if (!collector) {
			return
		}
		const events = collector.getEvents()
		if (events.length === 0) {
			return
		}
		response.extensions ??= {}
		response.extensions.triggeredActions = { events: [...events] }
	},
})
