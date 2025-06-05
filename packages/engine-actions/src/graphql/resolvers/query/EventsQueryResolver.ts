import {
	Event,
	QueryEventsInProcessingArgs,
	QueryEventsToProcessArgs,
	QueryFailedEventsArgs,
	QueryResolvers,
} from '../../schema'
import { ActionsContext } from '../ActionsContext'
import { EventsToProcessQuery } from '../../../model/EventsToProcessQuery'
import { EventRow } from '../../../model/types'
import { DatabaseContext, StagesQuery } from '@contember/engine-system-api'
import { Client, DatabaseQuery } from '@contember/database'
import { EventsInProcessingQuery } from '../../../model/EventsInProcessingQuery'
import { FailedEventsQuery } from '../../../model/FailedEventsQuery'
import { ActionsAuthorizationActions } from '../../../authorization'
import { EventByIdQuery } from '../../../model/EventByIdQuery'

export class EventsQueryResolver implements QueryResolvers<ActionsContext> {
	async eventsInProcessing(parent: unknown, { args }: QueryEventsInProcessingArgs, ctx: ActionsContext) {
		await ctx.requireAccess(ActionsAuthorizationActions.EVENTS_VIEW)

		return await this.fetchEvents(ctx.db, new EventsInProcessingQuery(args ?? {}))
	}

	async eventsToProcess(parent: unknown, { args }: QueryEventsToProcessArgs, ctx: ActionsContext) {
		await ctx.requireAccess(ActionsAuthorizationActions.EVENTS_VIEW)

		return await this.fetchEvents(ctx.db, new EventsToProcessQuery(args ?? {}))
	}

	async failedEvents(parent: unknown, { args }: QueryFailedEventsArgs, ctx: ActionsContext) {
		await ctx.requireAccess(ActionsAuthorizationActions.EVENTS_VIEW)

		return await this.fetchEvents(ctx.db, new FailedEventsQuery(args ?? {}))
	}

	async event(parent: unknown, { id }: { id: string }, ctx: ActionsContext): Promise<Event | null> {
		await ctx.requireAccess(ActionsAuthorizationActions.EVENTS_VIEW)
		const stages = await this.fetchStagesMap(ctx.db)
		const result = await ctx.db.queryHandler.fetch(new EventByIdQuery(id))
		if (!result) {
			return null
		}
		return this.mapEventRows([result], stages)[0]
	}

	private async fetchEvents(db: DatabaseContext, query: DatabaseQuery<EventRow[]>) {
		const stages = await this.fetchStagesMap(db)
		return this.mapEventRows(await db.queryHandler.fetch(query), stages)
	}

	private async fetchStagesMap(db: DatabaseContext): Promise<Record<string, string>> {
		return Object.fromEntries((await db.queryHandler.fetch(new StagesQuery())).map(it => [it.id, it.slug]))
	}

	private mapEventRows(rows: EventRow[], stagesMap: Record<string, string>): Event[] {

		return rows.map(row => ({
			id: row.id,
			createdAt: row.created_at,
			resolvedAt: row.created_at,
			lastStateChange: row.last_state_change,
			visibleAt: row.visible_at,
			log: row.log,
			numRetries: row.num_retries,
			payload: row.payload,
			stage: stagesMap[row.stage_id],
			state: row.state,
			target: row.target,
			transactionId: row.transaction_id,
			identityId: row.identity_id ?? undefined,
			ipAddress: row.ip_address ?? undefined,
			userAgent: row.user_agent ?? undefined,
		}))
	}
}
