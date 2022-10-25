"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriggerPayloadPersister = void 0;
const database_1 = require("@contember/database");
class TriggerPayloadPersister {
    constructor(mapper, client, providers, stageId, schemaId) {
        this.mapper = mapper;
        this.client = client;
        this.providers = providers;
        this.stageId = stageId;
        this.schemaId = schemaId;
    }
    async persist(target, payloads) {
        const chunkSize = 100;
        for (let i = 0; i < payloads.length; i += chunkSize) {
            const chunk = payloads.slice(i, i + chunkSize);
            await database_1.InsertBuilder.create()
                .into('actions_event')
                .values(chunk.map(it => ({
                id: this.providers.uuid(),
                transaction_id: this.mapper.transactionId,
                created_at: 'now',
                visible_at: 'now',
                num_retries: 0,
                state: 'created',
                stage_id: this.stageId,
                schema_id: this.schemaId,
                target: target,
                payload: it,
            })))
                .execute(this.client);
        }
    }
}
exports.TriggerPayloadPersister = TriggerPayloadPersister;
//# sourceMappingURL=TriggerPayloadPersister.js.map