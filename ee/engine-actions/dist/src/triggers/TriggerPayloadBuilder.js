"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriggerPayloadBuilder = void 0;
const ImplementationException_1 = require("../ImplementationException");
const assertNever_1 = require("../utils/assertNever");
const engine_content_api_1 = require("@contember/engine-content-api");
class TriggerPayloadBuilder {
    constructor(mapper) {
        this.mapper = mapper;
    }
    async build(events) {
        const filteredEvents = events.filter(it => {
            var _a;
            return it.cause.type !== 'BeforeUpdateEvent'
                || ((_a = it.cause.afterEvent) === null || _a === void 0 ? void 0 : _a.hasChanges) === true;
        });
        if (filteredEvents.length === 0) {
            return [];
        }
        const selections = await this.fetchSelection(filteredEvents);
        const triggerType = filteredEvents[0].listener.trigger.type;
        if (triggerType === 'basic') {
            return filteredEvents.map(it => ({ trigger: it.listener.trigger.name, ...this.buildBaseEventPayloads(it, selections[it.primary]) }));
        }
        if (triggerType === 'watch') {
            return this.buildWatchEventPayloads(filteredEvents, selections);
        }
        return (0, assertNever_1.assertNever)(triggerType);
    }
    async preprocessEvent(event) {
        if (event.listener.type === 'delete' && event.listener.trigger.selection) {
            const input = this.convertSelectionNode(event.listener.trigger.selection);
            const selection = await this.mapper.selectUnique(event.entity, input.withArg('by', {
                [event.entity.primary]: event.primary,
            }), []);
            return { ...event, selection };
        }
        return event;
    }
    buildWatchEventPayloads(events, selections) {
        var _a;
        var _b;
        const byPrimary = {};
        for (const event of events) {
            (_a = byPrimary[_b = event.primary]) !== null && _a !== void 0 ? _a : (byPrimary[_b] = { primary: event.primary, events: [] });
            byPrimary[event.primary].events.push(event);
        }
        const payloads = [];
        for (const eventsByPrimary of Object.values(byPrimary)) {
            payloads.push({
                operation: 'watch',
                trigger: events[0].listener.trigger.name,
                entity: events[0].entity.name,
                id: eventsByPrimary.primary,
                selection: selections[eventsByPrimary.primary],
                events: eventsByPrimary.events.map(it => this.buildBaseEventPayloads(it)),
            });
        }
        return payloads;
    }
    buildBaseEventPayloads(event, selection) {
        switch (event.cause.type) {
            case 'AfterInsertEvent':
                return {
                    operation: 'create',
                    entity: event.cause.entity.name,
                    id: event.cause.id,
                    selection,
                    values: Object.fromEntries(event.cause.data.map(it => [it.fieldName, it.resolvedValue])),
                    path: 'path' in event.listener ? event.listener.path : undefined,
                };
            case 'AfterUpdateEvent':
            case 'BeforeUpdateEvent':
                const afterEvent = event.cause.type === 'AfterUpdateEvent' ? event.cause : event.cause.afterEvent;
                if (!afterEvent) {
                    throw new ImplementationException_1.ImplementationException();
                }
                return {
                    operation: 'update',
                    entity: event.cause.entity.name,
                    id: event.cause.id,
                    selection,
                    values: Object.fromEntries(event.cause.data.map(it => [it.fieldName, it.resolvedValue])),
                    path: 'path' in event.listener ? event.listener.path : undefined,
                    old: Object.fromEntries(afterEvent.data.map(it => [it.fieldName, it.old])),
                };
            case 'BeforeDeleteEvent':
                return {
                    operation: 'delete',
                    entity: event.cause.entity.name,
                    id: event.cause.id,
                    selection,
                    path: 'path' in event.listener ? event.listener.path : undefined,
                };
            case 'BeforeJunctionUpdateEvent':
                if (event.listener.type !== 'junction') {
                    throw new ImplementationException_1.ImplementationException();
                }
                const [id, inverseId] = event.listener.context.type === 'owning'
                    ? [event.cause.owningId, event.cause.inverseId]
                    : [event.cause.inverseId, event.cause.owningId];
                return {
                    operation: event.cause.operation === 'connect' ? 'junction-connect' : 'junction-disconnect',
                    entity: event.listener.context.entity.name,
                    relation: event.listener.context.relation.name,
                    id,
                    inverseId,
                    path: 'path' in event.listener ? event.listener.path : undefined,
                };
            default:
                (0, assertNever_1.assertNever)(event.cause, it => it.type);
        }
    }
    async fetchSelection(events) {
        const trigger = events[0].listener.trigger;
        if (!trigger.selection) {
            return {};
        }
        const ids = Array.from(new Set(events.filter(it => it.listener.type !== 'delete').map(it => it.primary)));
        if (ids.length === 0) {
            return {};
        }
        const entity = events[0].entity;
        const input = this.convertSelectionNode(trigger.selection).withArg('filter', {
            [entity.primary]: { in: ids },
        });
        return await this.mapper.selectAssoc(entity, input, [], entity.primary);
    }
    convertSelectionNode(node, nodeName = 'root', path = []) {
        return new engine_content_api_1.ObjectNode(nodeName, nodeName, node.map(it => {
            const [field, args, selection] = Array.isArray(it) ? it : [it, undefined, undefined];
            if (selection === undefined || selection.length === 0) {
                return new engine_content_api_1.FieldNode(field, field, {});
            }
            return this.convertSelectionNode(selection, field, [...path, nodeName]).withArgs(args);
        }), {}, {}, path);
    }
}
exports.TriggerPayloadBuilder = TriggerPayloadBuilder;
//# sourceMappingURL=TriggerPayloadBuilder.js.map