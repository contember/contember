"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookInvoker = void 0;
const DEFAULT_TIMEOUT_MS = 30000;
class WebhookInvoker {
    async send(invocation, payloads) {
        var _a;
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => {
            abortController.abort();
        }, (_a = invocation.timeoutMs) !== null && _a !== void 0 ? _a : DEFAULT_TIMEOUT_MS);
        const response = await fetch(invocation.url, {
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
        clearTimeout(timeoutId);
    }
}
exports.WebhookInvoker = WebhookInvoker;
//# sourceMappingURL=WebhookInvoker.js.map