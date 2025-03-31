import { DateTimeType, JSONType, UuidType } from '@contember/graphql-utils'
import { Resolvers } from '../schema'
import { EventsQueryResolver } from './query'
import { ProcessBatchMutationResolver, RetryEventMutationResolver, SetVariablesMutationResolver, StopEventMutationResolver } from './mutation'
import { ActionsContext } from './ActionsContext'
import { VariablesQueryResolver } from './query/VariablesQueryResolver'

export class ResolversFactory {
	constructor(
		private readonly eventsQueryResolver: EventsQueryResolver,
		private readonly processBatchMutationResolver: ProcessBatchMutationResolver,
		private readonly variablesQueryResolver: VariablesQueryResolver,
		private readonly setVariablesMutationResolver: SetVariablesMutationResolver,
		private readonly retryEventMutationResolver: RetryEventMutationResolver,
		private readonly stopEventMutationResolver: StopEventMutationResolver,
	) {
	}

	create(): Resolvers {
		const resolvers: Resolvers<ActionsContext> & { Mutation: Required<Resolvers<ActionsContext>['Mutation']> } & { Query: Required<Resolvers<ActionsContext>['Query']> } = {
			Json: JSONType,
			DateTime: DateTimeType,
			Uuid: UuidType,
			Mutation: {
				processBatch: this.processBatchMutationResolver.processBatch.bind(this.processBatchMutationResolver),
				setVariables: this.setVariablesMutationResolver.setVariables.bind(this.setVariablesMutationResolver),
				retryEvent: this.retryEventMutationResolver.retryEvent.bind(this.retryEventMutationResolver),
				stopEvent: this.stopEventMutationResolver.stopEvent.bind(this.stopEventMutationResolver),
			},
			Query: {
				eventsInProcessing: this.eventsQueryResolver.eventsInProcessing.bind(this.eventsQueryResolver),
				eventsToProcess: this.eventsQueryResolver.eventsToProcess.bind(this.eventsQueryResolver),
				failedEvents: this.eventsQueryResolver.failedEvents.bind(this.eventsQueryResolver),
				event: this.eventsQueryResolver.event.bind(this.eventsQueryResolver),
				variables: this.variablesQueryResolver.variables.bind(this.variablesQueryResolver),
			},
		}
		return resolvers
	}
}
