import { AnyEventPayload, BaseEventPayload, WatchEventPayload } from './Payload'
import { ImplementationException } from '../ImplementationException'
import { assertNever } from '../utils/assertNever'
import { FiredEvent } from './TriggerPayloadManager'
import { Actions, Input } from '@contember/schema'
import { FieldNode, Mapper, ObjectNode } from '@contember/engine-content-api'

type Selections = Record<Input.PrimaryValue, any>

export class TriggerPayloadBuilder {
	constructor(
		private readonly mapper: Mapper,
	) {
	}

	public async build(events: FiredEvent[]): Promise<AnyEventPayload[]> {
		const filteredEvents = events.filter(it => {
			return it.cause.type !== 'BeforeUpdateEvent'
				|| it.cause.afterEvent?.hasChanges === true
		})
		if (filteredEvents.length === 0) {
			return []
		}
		const selections = await this.fetchSelection(filteredEvents)
		const triggerType = filteredEvents[0].listener.trigger.type
		if (triggerType === 'basic') {
			return filteredEvents.map(it => ({ trigger: it.listener.trigger.name, ...this.buildBaseEventPayloads(it, selections[it.primary]) }))
		}
		if (triggerType === 'watch') {
			return this.buildWatchEventPayloads(filteredEvents, selections)
		}
		return assertNever(triggerType)
	}

	public async preprocessEvent(event: FiredEvent): Promise<FiredEvent> {
		if (event.listener.type === 'delete' && event.listener.trigger.selection) {
			const input = this.convertSelectionNode(event.listener.trigger.selection)

			const selection = await this.mapper.selectUnique(event.entity, input.withArg('by', {
				[event.entity.primary]: event.primary,
			}), [])
			return { ...event, selection }
		}
		return event
	}

	private buildWatchEventPayloads(events: FiredEvent[], selections: Selections): WatchEventPayload[] {
		const byPrimary: Record<Input.PrimaryValue, { primary: Input.PrimaryValue; events: FiredEvent[] }> = {}
		for (const event of events) {
			byPrimary[event.primary] ??= { primary: event.primary, events: [] }
			byPrimary[event.primary].events.push(event)
		}
		const payloads: WatchEventPayload[] = []
		for (const eventsByPrimary of Object.values(byPrimary)) {
			payloads.push({
				operation: 'watch',
				trigger: events[0].listener.trigger.name,
				entity: events[0].entity.name,
				id: eventsByPrimary.primary,
				selection: events[0].selection ?? selections[eventsByPrimary.primary],
				events: eventsByPrimary.events.map(it => this.buildBaseEventPayloads(it)),
			})
		}
		return payloads
	}

	private buildBaseEventPayloads(event: FiredEvent, selection?: any): BaseEventPayload {
		switch (event.cause.type) {
			case 'AfterInsertEvent':
				return {
					operation: 'create',
					entity: event.cause.entity.name,
					id: event.cause.id,
					selection,
					values: Object.fromEntries(event.cause.data.map(it => [it.fieldName, it.resolvedValue])),
					path: 'path' in event.listener ? event.listener.path : undefined,
				}
			case 'AfterUpdateEvent':
			case 'BeforeUpdateEvent':
				const afterEvent = event.cause.type === 'AfterUpdateEvent' ? event.cause : event.cause.afterEvent
				if (!afterEvent) {
					throw new ImplementationException()
				}
				return {
					operation: 'update',
					entity: event.cause.entity.name,
					id: event.cause.id,
					selection,
					values: Object.fromEntries(event.cause.data.map(it => [it.fieldName, it.resolvedValue])),
					path: 'path' in event.listener ? event.listener.path : undefined,
					old: Object.fromEntries(afterEvent.data.map(it => [it.fieldName, it.old])),
				}
			case 'BeforeDeleteEvent':
				return {
					operation: 'delete',
					entity: event.cause.entity.name,
					id: event.cause.id,
					selection,
					path: 'path' in event.listener ? event.listener.path : undefined,
				}
			case 'AfterJunctionUpdateEvent':
				if (event.listener.type !== 'junction') {
					throw new ImplementationException()
				}
				const [id, inverseId] = event.listener.context.type === 'owning'
					? [event.cause.owningId, event.cause.inverseId]
					: [event.cause.inverseId, event.cause.owningId]
				return {
					operation: event.cause.operation === 'connect' ? 'junction_connect' : 'junction_disconnect',
					entity: event.listener.context.entity.name,
					relation: event.listener.context.relation.name,
					id,
					inverseId,
					path: 'path' in event.listener ? event.listener.path : undefined,
				}
			default:
				assertNever(event.cause, it => it.type)
		}
	}

	private async fetchSelection(events: FiredEvent[]): Promise<Selections> {
		const trigger = events[0].listener.trigger
		if (!trigger.selection) {
			return {}
		}

		const ids = Array.from(new Set(events.filter(it => it.listener.type !== 'delete').map(it => it.primary)))
		if (ids.length === 0) {
			return {}
		}
		const entity = events[0].entity
		const input = this.convertSelectionNode(trigger.selection).withArg('filter', {
			[entity.primary]: { in: ids },
		})
		return await this.mapper.selectAssoc(entity, input, [], entity.primary)
	}


	private convertSelectionNode(node: Actions.SelectionNode, nodeName = 'root', path: string[] = []): ObjectNode<Input.ListQueryInput> {
		return new ObjectNode(nodeName, nodeName, node.map(it => {
			const [field, args, selection] = Array.isArray(it) ? it : [it, undefined, undefined]
			if (selection === undefined || selection.length === 0) {
				return new FieldNode(field, field, {})
			}
			return this.convertSelectionNode(selection, field, [...path, nodeName]).withArgs(args)
		}), {}, {}, path)
	}
}
