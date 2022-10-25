"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueClosedError = exports.QueueError = exports.Queue = void 0;
class Queue {
    constructor(concurrency) {
        this.concurrency = concurrency;
        this.processing = new Set();
        this.resolvers = [];
        this.closed = false;
    }
    async execute(cb) {
        if (this.closed) {
            throw new QueueClosedError();
        }
        if (this.processing.size < this.concurrency) {
            return await this.doExecute(cb);
        }
        await new Promise(resolve => this.resolvers.push(resolve));
        return await this.execute(cb);
    }
    async close() {
        this.closed = true;
        const resolvers = this.resolvers;
        this.resolvers = [];
        resolvers.forEach(it => it());
        await Promise.allSettled(this.processing.values());
    }
    setConcurrency(concurrency) {
        this.concurrency = concurrency;
        this.processNext();
    }
    async doExecute(cb) {
        const promise = cb();
        this.processing.add(promise);
        try {
            return await promise;
        }
        finally {
            this.processing.delete(promise);
            this.processNext();
        }
    }
    processNext() {
        for (let i = this.processing.size; i < this.concurrency; i++) {
            const resolver = this.resolvers.shift();
            if (resolver) {
                resolver();
            }
        }
    }
}
exports.Queue = Queue;
class QueueError {
}
exports.QueueError = QueueError;
class QueueClosedError extends QueueError {
}
exports.QueueClosedError = QueueClosedError;
//# sourceMappingURL=Queue.js.map