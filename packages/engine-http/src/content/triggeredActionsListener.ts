import { GraphQLListener } from '../graphql'
import { ContentGraphqlContext } from './ContentGraphqlContext'

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
