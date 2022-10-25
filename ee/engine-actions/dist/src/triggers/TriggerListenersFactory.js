"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriggerListenersFactory = void 0;
const TriggerListenersBuilder_1 = require("./TriggerListenersBuilder");
class TriggerListenersFactory {
    constructor(schema) {
        this.schema = schema;
    }
    create() {
        const builder = new TriggerListenersBuilder_1.TriggerListenerBuilder(this.schema.model);
        for (const trigger of Object.values(this.schema.actions.triggers)) {
            builder.add(trigger);
        }
        return builder.createStore();
    }
}
exports.TriggerListenersFactory = TriggerListenersFactory;
//# sourceMappingURL=TriggerListenersFactory.js.map