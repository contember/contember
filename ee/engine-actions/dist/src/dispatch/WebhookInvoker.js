"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookInvoker = void 0;
const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds
class WebhookInvoker {
    async send(invocation, payloads) {
        const abortController = new AbortController();
        const timeoutMs = invocation.timeoutMs;
        const start = process.hrtime.bigint();
        const getDuration = () => Math.floor(Number((process.hrtime.bigint() - start) / BigInt(1000)));
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
                        events: payloads,
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
            return {
                ok: response.ok,
                code: response.status,
                durationMs: getDuration(),
                response: responseText,
                errorMessage: !response.ok ? response.statusText : undefined,
            };
        }
        catch (e) {
            return {
                ok: false,
                errorMessage: typeof e === 'object' && e !== null && 'message' in e && typeof e.message === 'string'
                    ? e.message
                    : undefined,
                durationMs: getDuration(),
            };
        }
    }
}
exports.WebhookInvoker = WebhookInvoker;
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
//# sourceMappingURL=WebhookInvoker.js.map