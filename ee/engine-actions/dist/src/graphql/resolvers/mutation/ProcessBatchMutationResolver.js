"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessBatchMutationResolver = void 0;
class ProcessBatchMutationResolver {
    constructor(eventDispatcher) {
        this.eventDispatcher = eventDispatcher;
    }
    async processBatch(parent, args, ctx) {
        await this.eventDispatcher.processBatch(ctx);
        return {
            ok: true,
        };
    }
}
exports.ProcessBatchMutationResolver = ProcessBatchMutationResolver;
//# sourceMappingURL=ProcessBatchMutationResolver.js.map