"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriggerListenersStore = void 0;
class TriggerListenersStore {
    constructor(listeners) {
        this.listeners = listeners;
    }
    getUpdateListeners(entityName) {
        var _a;
        return (_a = this.listeners.updateListeners.get(entityName)) !== null && _a !== void 0 ? _a : [];
    }
    getDeleteListener(entityName) {
        var _a;
        return (_a = this.listeners.deleteListeners.get(entityName)) !== null && _a !== void 0 ? _a : [];
    }
    getCreateListener(entityName) {
        var _a;
        return (_a = this.listeners.createListeners.get(entityName)) !== null && _a !== void 0 ? _a : [];
    }
    getIndirectListeners(entityName) {
        var _a;
        return (_a = this.listeners.indirectListeners.get(entityName)) !== null && _a !== void 0 ? _a : [];
    }
    getJunctionListeners(entityName, relationName) {
        var _a, _b;
        return (_b = (_a = this.listeners.junctionListeners.get(entityName)) === null || _a === void 0 ? void 0 : _a.get(relationName)) !== null && _b !== void 0 ? _b : [];
    }
}
exports.TriggerListenersStore = TriggerListenersStore;
//# sourceMappingURL=TriggerListenersStore.js.map