"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsRepository = void 0;
const database_1 = require("@contember/database");
const ACK_TIMEOUT_MS = 1000 * 60 * 10; // 10 minutes
const DEFAULT_REPEAT_INTERVAL_MS = 5000; // 5 seconds
const DEFAULT_MAX_ATTEMPTS = 10;
const DEFAULT_BATCH_SIZE = 20;
class EventsRepository {
    async fetchBatch(actions, db) {
        var _a;
        const primaryEvent = (await this.fetchInternal(db, 1))[0];
        if (!primaryEvent) {
            return undefined;
        }
        const target = actions.targets[primaryEvent.target];
        if (!target) {
            await this.markFailedOnUnknownTarget(db, primaryEvent.target, primaryEvent.id);
            return undefined;
        }
        const batchSize = ((_a = target.batchSize) !== null && _a !== void 0 ? _a : DEFAULT_BATCH_SIZE) - 1;
        const batch = batchSize > 0 ? await this.fetchInternal(db, batchSize) : [];
        return { events: [primaryEvent, ...batch], target };
    }
    async fetchInternal(db, limit, targetName) {
        const visibleAt = new Date();
        visibleAt.setTime(visibleAt.getTime() + ACK_TIMEOUT_MS);
        return await database_1.UpdateBuilder.create()
            .table('actions_event')
            .with('events', qb => qb
            .select(it => it.raw('*'))
            .from('actions_event')
            .where(it => it.in('state', ['retrying', 'created', 'processing']))
            .where(it => it.compare('visible_at', database_1.Operator.lte, 'now'))
            .where(targetName ? { target: targetName } : {})
            .orderBy('visible_at')
            .limit(limit)
            .lock(database_1.LockType.forNoKeyUpdate, database_1.LockModifier.skipLocked))
            .values({
            state: 'processing',
            last_state_change: new Date(),
            visible_at: visibleAt,
        })
            .from(it => it.from('events').where(it => it.columnsEq(['events', 'id'], ['actions_event', 'id'])))
            .returning(new database_1.Literal('*'))
            .execute(db);
    }
    async persistProcessed(db, events) {
        return await db.transaction(async (trx) => {
            await trx.query(database_1.Connection.REPEATABLE_READ);
            const succeed = events.filter(it => it.result.ok);
            await this.markSucceed(db, succeed.map(it => it.row));
            for (const event of events) {
                if (!event.result.ok) {
                    await this.markFailed(db, event);
                }
            }
            return [succeed.length, events.length - succeed.length];
        });
    }
    async requeue(db, events) {
        await database_1.UpdateBuilder.create()
            .table('actions_event')
            .values({
            state: it => it.raw('CASE WHEN num_retries = 0 THEN ? ELSE ? END', 'created', 'retrying'),
            last_state_change: new Date(),
            visible_at: new Date(),
        })
            .where(it => it.in('id', events.map(it => it.id)))
            .execute(db);
    }
    async markSucceed(db, rows) {
        const now = new Date();
        await database_1.UpdateBuilder.create()
            .table('actions_event')
            .values({
            state: 'succeed',
            num_retries: it => it.raw('num_retries + 1'),
            resolved_at: now,
            last_state_change: now,
        })
            .where(it => it.in('id', rows.map(it => it.id)))
            .execute(db);
    }
    async markFailed(db, event) {
        var _a, _b, _c, _d;
        const numRetries = event.row.num_retries;
        const now = new Date();
        const nextAttempt = new Date();
        nextAttempt.setTime(nextAttempt.getTime() + ((_b = (_a = event.target) === null || _a === void 0 ? void 0 : _a.initialRepeatIntervalMs) !== null && _b !== void 0 ? _b : DEFAULT_REPEAT_INTERVAL_MS) * Math.pow(2, event.row.num_retries));
        await database_1.UpdateBuilder.create()
            .table('actions_event')
            .values({
            last_state_change: now,
            num_retries: event.row.num_retries + 1,
            log: JSON.stringify([...event.row.log, event.result]),
            ...(numRetries < ((_d = (_c = event.target) === null || _c === void 0 ? void 0 : _c.maxAttempts) !== null && _d !== void 0 ? _d : DEFAULT_MAX_ATTEMPTS) ? {
                state: 'retrying',
                visible_at: nextAttempt,
            } : {
                state: 'failed',
            }),
        })
            .where({ id: event.row.id })
            .execute(db);
    }
    async markFailedOnUnknownTarget(db, targetName, primaryEventId) {
        await database_1.UpdateBuilder.create()
            .table('actions_event')
            .where(it => it.or(it => it
            .and(it => it
            .in('state', ['retrying', 'created', 'processing'])
            .compare('visible_at', database_1.Operator.lte, 'now')
            .compare('target', database_1.Operator.eq, targetName))
            .and(it => it
            .compare('id', database_1.Operator.eq, primaryEventId))))
            .values({
            // intentionally not retrying
            last_state_change: new Date(),
            num_retries: it => it.raw('num_retries + 1'),
            log: it => it.raw('log || ?::jsonb', { ok: false, errorMessage: `Event target ${targetName} not found, stopping.` }),
            state: 'failed',
            resolved_at: new Date(),
        })
            .execute(db);
    }
}
exports.EventsRepository = EventsRepository;
//# sourceMappingURL=EventsRepository.js.map