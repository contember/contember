import { ContentEvent, EventType } from './types.js'
import { CreateEvent, DeleteEvent, EventType as ApiEventType, TruncateEvent, UpdateEvent } from '../../schema/index.js'
import { assertNever } from '../../utils/index.js'
import { IdentityFetcher } from '../dependencies/index.js'
import { formatIdentity } from './identityUtils.js'
import { appendCreateSpecificData, appendDeleteSpecificData, appendUpdateSpecificData } from './EventResponseHelper.js'

export class EventResponseBuilder {
	constructor(private readonly identityFetcher: IdentityFetcher) {}

	public async buildResponse(events: ContentEvent[]): Promise<(CreateEvent | DeleteEvent | TruncateEvent | UpdateEvent)[]> {
		const apiEventTypeMapping = {
			[EventType.create]: ApiEventType.Create,
			[EventType.update]: ApiEventType.Update,
			[EventType.delete]: ApiEventType.Delete,
			[EventType.truncate]: ApiEventType.Truncate,
		}
		const identityIds = events.map(it => it.identityId).filter((it, index, ids) => ids.indexOf(it) === index)
		const identities = await this.identityFetcher.fetchIdentities(identityIds)
		const identitiesMap = Object.fromEntries(identities.map(it => [it.identityId, it]))

		return events.map(it => {
			const commonData = {
				createdAt: it.createdAt,
				appliedAt: it.appliedAt,
				id: it.id,
				type: apiEventTypeMapping[it.type],
				description: this.formatDescription(it),
				transactionId: it.transactionId,
				identityId: it.identityId,
				identityDescription: formatIdentity(identitiesMap[it.identityId]),
			}
			switch (it.type) {
				case EventType.create:
					return ((): CreateEvent => appendCreateSpecificData(commonData, it))()
				case EventType.update:
					return ((): UpdateEvent => appendUpdateSpecificData(commonData, it))()
				case EventType.delete:
					return ((): DeleteEvent => appendDeleteSpecificData(commonData, it))()
				case EventType.truncate:
					return ((): TruncateEvent => ({ ...commonData, tableName: null, primaryKey: null }))()
			}
			assertNever(it)
		})
	}

	private formatDescription(event: ContentEvent): string {
		switch (event.type) {
			case EventType.create:
				return `Creating ${event.tableName}#${event.rowId.join(';')}`
			case EventType.update:
				return `Updating ${event.tableName}#${event.rowId.join(';')}`
			case EventType.delete:
				return `Deleting ${event.tableName}#${event.rowId.join(';')}`
			case EventType.truncate:
				return 'Truncating content'
			default:
				return assertNever(event)
		}
	}
}
