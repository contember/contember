"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TargetHandlerResolver = void 0;
const ImplementationException_1 = require("../ImplementationException");
class TargetHandlerResolver {
    constructor(webhookHandler) {
        this.webhookHandler = webhookHandler;
    }
    resolveHandler(target) {
        if (target.type !== 'webhook') {
            throw new ImplementationException_1.ImplementationException('Invalid trigger invocation type');
        }
        return this.webhookHandler;
    }
}
exports.TargetHandlerResolver = TargetHandlerResolver;
//# sourceMappingURL=TargetHandlerResolver.js.map