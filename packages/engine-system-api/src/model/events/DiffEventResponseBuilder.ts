import { EventType } from '@contember/engine-common'
import { DiffEvent as ApiEvent, DiffEventType as ApiEventType } from '../../schema'
import { assertNever } from '../../utils'
import { EventWithDependencies } from './DiffBuilder'
import { IdentityFetcher } from '../dependencies/tenant/IdentityFetcher'
import { formatIdentity } from './identityUtils'

export class DiffEventResponseBuilder {
	constructor(private readonly identityFetcher: IdentityFetcher) {}

	public async buildResponse(events: EventWithDependencies[]): Promise<ApiEvent[]> {
		const apiEventTypeMapping = {
			[EventType.create]: ApiEventType.Create,
			[EventType.update]: ApiEventType.Update,
			[EventType.delete]: ApiEventType.Delete,
		}
		const identityIds = events.map(it => it.identityId).filter((it, index, ids) => ids.indexOf(it) === index)
		const identities = await this.identityFetcher.fetchIdentities(identityIds)
		const identitiesMap = Object.fromEntries(identities.map(it => [it.identityId, it]))

		return events.map(it => ({
			createdAt: it.createdAt,
			dependencies: [...it.dependencies.values()],
			id: it.id,
			type: apiEventTypeMapping[it.type],
			description: this.formatDescription(it),
			transactionId: it.transactionId,
			identityId: it.identityId,
			identityDescription: formatIdentity(identitiesMap[it.identityId]),
		}))
	}

	private formatDescription(event: EventWithDependencies): string {
		switch (event.type) {
			case EventType.create:
				return `Creating ${event.tableName}#${event.rowId}`
			case EventType.update:
				return `Updating ${event.tableName}#${event.rowId}`
			case EventType.delete:
				return `Deleting ${event.tableName}#${event.rowId}`
			default:
				return assertNever(event)
		}
	}
}
