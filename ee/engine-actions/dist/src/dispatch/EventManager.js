"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventManager = void 0;
const database_1 = require("@contember/database");
class EventManager {
    constructor(db) {
        this.db = db;
    }
    async fetchForProcessing(limit) {
        return await this.db.transaction(async (trx) => {
            await trx.query(database_1.Connection.REPEATABLE_READ);
            await database_1.UpdateBuilder.create()
                .table('actions_event')
                .values({
                state: 'processing',
                last_state_change: 'now',
            })
                .where(it => it.in('state', ['retrying', 'created']));
        });
    }
}
exports.EventManager = EventManager;
//# sourceMappingURL=EventManager.js.map