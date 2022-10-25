"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookTargetHandler = void 0;
const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds
class WebhookTargetHandler {
    async handle(invocation, events, logger) {
        const abortController = new AbortController();
        const timeoutMs = invocation.timeoutMs;
        const start = process.hrtime.bigint();
        const getDuration = () => Math.floor(Number((process.hrtime.bigint() - start) / BigInt(1000000)));
        try {
            const response = await withTimeout({ abortController, timeoutMs }, async () => {
                return await fetch(invocation.url, {
                    method: 'POST',
                    headers: {
                        ['User-Agent']: 'Contember Actions',
                        ...invocation.headers,
                        ['Content-type']: 'application/json',
                    },
                    signal: abortController.signal,
                    body: JSON.stringify({
                        events: events.map(it => it.payload),
                    }),
                });
            });
            let responseText;
            try {
                responseText = await withTimeout({ abortController, timeoutMs }, async () => {
                    return await response.text();
                });
            }
            catch (_a) {
            }
            const result = {
                ok: response.ok,
                code: response.status,
                durationMs: getDuration(),
                response: responseText,
                errorMessage: !response.ok ? response.statusText : undefined,
            };
            // todo: per-event response format
            return events.map(it => ({ invocation, row: it, result }));
        }
        catch (e) {
            logger.warn(e);
            const errorMessages = [];
            let err = e;
            while (typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string') {
                errorMessages.push(err.message);
                err = err.cause;
            }
            const result = {
                ok: false,
                errorMessage: errorMessages.length ? errorMessages.join('; ') : undefined,
                durationMs: getDuration(),
            };
            return events.map(it => ({ invocation, row: it, result }));
        }
    }
}
exports.WebhookTargetHandler = WebhookTargetHandler;
const withTimeout = async ({ abortController, timeoutMs }, cb) => {
    const timeoutId = setTimeout(() => {
        abortController.abort();
    }, timeoutMs !== null && timeoutMs !== void 0 ? timeoutMs : DEFAULT_TIMEOUT_MS);
    try {
        return await cb();
    }
    finally {
        clearTimeout(timeoutId);
    }
};
//# sourceMappingURL=WebhookTargetHandler.js.map