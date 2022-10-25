"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListenerStoreProvider = void 0;
const triggers_1 = require("./triggers");
class ListenerStoreProvider {
    constructor() {
        this.listenersStoreCache = new WeakMap();
    }
    getListenerStore(schema) {
        const currentStore = this.listenersStoreCache.get(schema);
        if (currentStore) {
            return currentStore;
        }
        const listenersFactory = new triggers_1.TriggerListenersFactory(schema);
        const newStore = listenersFactory.create();
        this.listenersStoreCache.set(schema, newStore);
        return newStore;
    }
}
exports.ListenerStoreProvider = ListenerStoreProvider;
//# sourceMappingURL=ListenerStoreProvider.js.map