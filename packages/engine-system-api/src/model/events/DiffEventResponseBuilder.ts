import { EventType } from '@contember/engine-common'
import {
	DiffCreateEvent,
	DiffDeleteEvent,
	DiffEvent as ApiEvent,
	DiffEventType as ApiEventType,
	DiffUpdateEvent,
} from '../../schema'
import { assertNever } from '../../utils'
import { EventWithDependencies } from './DiffBuilder'
import { IdentityFetcher } from '../dependencies/tenant/IdentityFetcher'
import { formatIdentity } from './identityUtils'
import { appendCreateSpecificData, appendDeleteSpecificData, appendUpdateSpecificData } from './EventResponseHelper'

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

		return events.map(it => {
			const commonData = {
				createdAt: it.createdAt,
				dependencies: [...it.dependencies.values()],
				id: it.id,
				type: apiEventTypeMapping[it.type],
				description: this.formatDescription(it),
				transactionId: it.transactionId,
				identityId: it.identityId,
				identityDescription: formatIdentity(identitiesMap[it.identityId]),
			}
			switch (it.type) {
				case EventType.create:
					return ((): DiffCreateEvent => appendCreateSpecificData(commonData, it))()
				case EventType.update:
					return ((): DiffUpdateEvent => appendUpdateSpecificData(commonData, it))()
				case EventType.delete:
					return ((): DiffDeleteEvent => appendDeleteSpecificData(commonData, it))()
			}
			assertNever(it)
		})
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
