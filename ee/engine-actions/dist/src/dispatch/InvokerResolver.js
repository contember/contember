"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvokerResolver = void 0;
const ImplementationException_1 = require("../ImplementationException");
class InvokerResolver {
    constructor(actions, webhookHandler) {
        this.actions = actions;
        this.webhookHandler = webhookHandler;
    }
    resolveInvoker(triggerName) {
        const triggerDefinition = this.actions.triggers[triggerName];
        if (!triggerDefinition) {
            return undefined;
        }
        if (triggerDefinition.invoke.type !== 'webhook') {
            throw new ImplementationException_1.ImplementationException('Invalid trigger invocation type');
        }
        return { definition: triggerDefinition.invoke, handler: this.webhookHandler };
    }
}
exports.InvokerResolver = InvokerResolver;
//# sourceMappingURL=InvokerResolver.js.map