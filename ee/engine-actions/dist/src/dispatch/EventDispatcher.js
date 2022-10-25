"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventDispatcher = void 0;
const logger_1 = require("@contember/logger");
const Queue_1 = require("../utils/Queue");
class EventDispatcher {
    constructor(eventsRepository, invokeResolver) {
        this.eventsRepository = eventsRepository;
        this.invokeResolver = invokeResolver;
    }
    async processBatch({ db, schema }) {
        const batch = await this.eventsRepository.fetchBatch(schema.actions, db);
        const batchId = Math.random().toString().substring(2);
        const batchLogger = logger_1.logger.child({ loc: 'EventDispatcher', batchId });
        if (!batch) {
            batchLogger.debug('Actions: Nothing to process');
            return { failed: 0, succeed: 0 };
        }
        const { target, events } = batch;
        try {
            const handler = this.invokeResolver.resolveHandler(target);
            batchLogger.debug('Actions: Processing started', {
                events: batch.events.map(it => it.id),
            });
            const handledEvents = await handler.handle(target, events, batchLogger);
            const [succeed, failed] = await this.eventsRepository.persistProcessed(db, handledEvents);
            batchLogger.debug('Actions: Processing done', { succeed, failed });
            return { succeed, failed };
        }
        catch (e) {
            if (e instanceof Queue_1.QueueClosedError) {
                batchLogger.warn('Actions: Queue closed, requeueing');
                await this.eventsRepository.requeue(db, events);
            }
            else {
                logger_1.logger.error(e, { loc: 'EventDispatcher', batchId });
                const failedEvents = events.map((it) => ({
                    row: it,
                    result: { ok: false, errorMessage: `Internal error` },
                }));
                await this.eventsRepository.persistProcessed(db, failedEvents);
            }
            return { succeed: 0, failed: batch.events.length };
        }
    }
}
exports.EventDispatcher = EventDispatcher;
//# sourceMappingURL=EventDispatcher.js.map