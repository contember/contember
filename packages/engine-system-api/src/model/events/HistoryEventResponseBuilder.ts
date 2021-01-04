import { AnyEvent, EventType } from '@contember/engine-common'
import {
	HistoryCreateEvent,
	HistoryDeleteEvent,
	HistoryEvent as ApiEvent,
	HistoryEventType as ApiEventType,
	HistoryRunMigrationEvent,
	HistoryUpdateEvent,
} from '../../schema'
import { assertNever } from '../../utils'
import { IdentityFetcher } from '../dependencies/tenant/IdentityFetcher'
import { formatIdentity } from './identityUtils'
import { appendCreateSpecificData, appendDeleteSpecificData, appendUpdateSpecificData } from './EventResponseHelper'

export class HistoryEventResponseBuilder {
	constructor(private readonly identityFetcher: IdentityFetcher) {}

	public async buildResponse(events: AnyEvent[]): Promise<ApiEvent[]> {
		const apiEventTypeMapping = {
			[EventType.create]: ApiEventType.Create,
			[EventType.update]: ApiEventType.Update,
			[EventType.delete]: ApiEventType.Delete,
			[EventType.runMigration]: ApiEventType.RunMigration,
		}
		const identityIds = events.map(it => it.identityId).filter((it, index, ids) => ids.indexOf(it) === index)
		const identities = await this.identityFetcher.fetchIdentities(identityIds)
		const identitiesMap = Object.fromEntries(identities.map(it => [it.identityId, it]))

		return events.map(it => {
			const commonData = {
				createdAt: it.createdAt,
				id: it.id,
				type: apiEventTypeMapping[it.type],
				description: this.formatDescription(it),
				transactionId: it.transactionId,
				identityId: it.identityId,
				identityDescription: formatIdentity(identitiesMap[it.identityId]),
			}
			switch (it.type) {
				case EventType.create:
					return ((): HistoryCreateEvent => appendCreateSpecificData(commonData, it))()
				case EventType.update:
					return ((): HistoryUpdateEvent => appendUpdateSpecificData(commonData, it))()
				case EventType.delete:
					return ((): HistoryDeleteEvent => appendDeleteSpecificData(commonData, it))()
				case EventType.runMigration:
					return ((): HistoryRunMigrationEvent => commonData)()
			}
			assertNever(it)
		})
	}

	private formatDescription(event: AnyEvent): string {
		switch (event.type) {
			case EventType.create:
				return `Creating ${event.tableName}#${event.rowId}`
			case EventType.update:
				return `Updating ${event.tableName}#${event.rowId}`
			case EventType.delete:
				return `Deleting ${event.tableName}#${event.rowId}`
			case EventType.runMigration:
				return 'Executing a migration'
			default:
				return assertNever(event)
		}
	}
}
