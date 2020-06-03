import { AnyEvent, EventType } from '@contember/engine-common'
import { HistoryEvent as ApiEvent, HistoryEventType as ApiEventType } from '../../schema'
import { assertNever } from '../../utils'
import { IdentityFetcher, TenantIdentity } from '../dependencies/tenant/IdentityFetcher'
import { formatIdentity } from './identityUtils'

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

		return events.map(it => ({
			createdAt: it.createdAt,
			id: it.id,
			type: apiEventTypeMapping[it.type],
			description: this.formatDescription(it),
			transactionId: it.transactionId,
			identityId: it.identityId,
			identityDescription: formatIdentity(identitiesMap[it.identityId]),
		}))
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
