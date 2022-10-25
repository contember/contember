"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsManager = void 0;
const database_1 = require("@contember/database");
const DEFAULT_REPEAT_INTERVAL_MS = 5000;
const DEFAULT_MAX_ATTEMPTS = 10;
class EventsManager {
    async fetchForProcessing(db, limit) {
        return await database_1.UpdateBuilder.create()
            .table('actions_event')
            .with('events', qb => qb
            .select(it => it.raw('*'))
            .from('actions_event')
            .where(it => it.in('state', ['retrying', 'created']))
            .where(it => it.compare('next_attempt_at', database_1.Operator.lte, 'now'))
            .orderBy('next_attempt_at')
            .limit(limit)
            .lock(database_1.LockType.forNoKeyUpdate, database_1.LockModifier.skipLocked))
            .values({
            state: 'processing',
            last_state_change: 'now',
        })
            .from(it => it.from('events').where(it => it.columnsEq(['events', 'id'], ['actions_event', 'id'])))
            .returning(new database_1.Literal('*'))
            .execute(db);
    }
    async persistProcessed(db, events) {
        const succeed = events.filter(it => it.result.ok);
        await this.markSucceed(succeed.map(it => it.row));
        for (const event of events) {
            if (!event.result.ok) {
                await this.markFailed(db, event);
            }
        }
    }
    async markSucceed(rows) {
        const now = new Date();
        await database_1.UpdateBuilder.create()
            .table('actions_event')
            .values({
            state: 'succeed',
            num_retries: it => it.raw('num_retries + 1'),
            resolved_at: now,
            last_state_change: now,
        })
            .where(it => it.in('id', rows.map(it => it.id)));
    }
    async markFailed(db, event) {
        var _a, _b;
        const numRetries = event.row.num_retries;
        const now = new Date();
        const nextAttempt = new Date();
        nextAttempt.setTime(nextAttempt.getTime() + ((_a = event.trigger.invoke.initialRepeatIntervalMs) !== null && _a !== void 0 ? _a : DEFAULT_REPEAT_INTERVAL_MS) * Math.pow(2, event.row.num_retries));
        await database_1.UpdateBuilder.create()
            .table('actions_event')
            .values({
            last_state_change: now,
            num_retries: event.row.num_retries + 1,
            log: [...event.row.log, event.result],
            ...(numRetries < ((_b = event.trigger.invoke.maxAttempts) !== null && _b !== void 0 ? _b : DEFAULT_MAX_ATTEMPTS) ? {
                state: 'retrying',
                next_attempt_at: nextAttempt,
            } : {
                state: 'failed',
            }),
        })
            .where({ id: event.row.id })
            .execute(db);
    }
}
exports.EventsManager = EventsManager;
//# sourceMappingURL=EventsManager.js.map