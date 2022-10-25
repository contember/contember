"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriggerPayloadManager = void 0;
class TriggerPayloadManager {
    constructor(triggerPayloadBuilder, triggerPayloadPersister) {
        this.triggerPayloadBuilder = triggerPayloadBuilder;
        this.triggerPayloadPersister = triggerPayloadPersister;
        this.eventsByTrigger = {};
    }
    async add(firedEvent) {
        var _a;
        var _b, _c;
        const event = await this.triggerPayloadBuilder.preprocessEvent(firedEvent);
        (_a = (_b = this.eventsByTrigger)[_c = firedEvent.listener.trigger.name]) !== null && _a !== void 0 ? _a : (_b[_c] = []);
        this.eventsByTrigger[firedEvent.listener.trigger.name].push(event);
    }
    async persist() {
        for (const events of Object.values(this.eventsByTrigger)) {
            const payloads = await this.triggerPayloadBuilder.build(events);
            const triggerTarget = events[0].listener.trigger.target;
            await this.triggerPayloadPersister.persist(triggerTarget, payloads);
        }
    }
}
exports.TriggerPayloadManager = TriggerPayloadManager;
//# sourceMappingURL=TriggerPayloadManager.js.map