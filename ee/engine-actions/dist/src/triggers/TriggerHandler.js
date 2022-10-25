"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriggerHandler = void 0;
class TriggerHandler {
    constructor(payloadManager, listenersStore, changesFetcher) {
        this.payloadManager = payloadManager;
        this.listenersStore = listenersStore;
        this.changesFetcher = changesFetcher;
    }
    attach(evm) {
        evm.listen('BeforeDeleteEvent', async (event) => {
            await this.directDeleteHandler(event);
            await this.indirectChangesEntityHandler(event);
        });
        evm.listen('AfterInsertEvent', async (event) => {
            await this.indirectChangesEntityHandler(event);
            await this.directCreateHandler(event);
        });
        evm.listen('BeforeUpdateEvent', async (event) => {
            await this.indirectChangesRelationHandler(event);
            // todo revert when no update?
        });
        evm.listen('AfterUpdateEvent', async (event) => {
            if (event.hasChanges) {
                await this.indirectChangesUpdatesHandler(event);
                await this.directUpdateHandler(event);
            }
        });
        evm.listen('BeforeJunctionUpdateEvent', async (event) => {
            await this.junctionHandler(event);
        });
        evm.listen('BeforeCommitEvent', async (event) => {
            await this.payloadManager.persist();
        });
    }
    async directDeleteHandler(event) {
        const deleteListeners = this.listenersStore.getDeleteListener(event.entity.name);
        if (!deleteListeners) {
            return;
        }
        await Promise.all(deleteListeners.map(listener => {
            return this.payloadManager.add({
                listener,
                entity: event.entity,
                primary: event.id,
                cause: event,
            });
        }));
    }
    async directUpdateHandler(event) {
        const updateListeners = this.listenersStore.getUpdateListeners(event.entity.name);
        updateListeners.map(listener => {
            if (event.data.some(it => listener.fields.has(it.fieldName))) {
                this.payloadManager.add({
                    listener,
                    entity: event.entity,
                    primary: event.id,
                    cause: event,
                });
            }
        });
    }
    async directCreateHandler(event) {
        const createListeners = this.listenersStore.getCreateListener(event.entity.name);
        createListeners.map(listener => {
            this.payloadManager.add({
                listener,
                entity: event.entity,
                primary: event.id,
                cause: event,
            });
        });
    }
    /**
     * Collect affected triggers after entity was created or before it was deleted.
     * todo: after insert, it should probably check only owning relations, because other relations are connected later, so it would be always empty
     */
    async indirectChangesEntityHandler(event) {
        //
        const indirectEntityListeners = this.listenersStore.getIndirectListeners(event.entity.name);
        const promises = indirectEntityListeners.map(listener => this.collectDeepChanges(event, listener, {
            [event.entity.primary]: { eq: event.id },
        }));
        await Promise.all(promises);
    }
    async indirectChangesRelationHandler(event) {
        await this.indirectChangesUpdatesHandlerInner(event, 'relations');
    }
    async indirectChangesUpdatesHandler(event) {
        await this.indirectChangesUpdatesHandlerInner(event, 'fields');
    }
    async indirectChangesUpdatesHandlerInner(event, type) {
        const indirectEntityListeners = this.listenersStore.getIndirectListeners(event.entity.name);
        const promises = indirectEntityListeners.map(listener => {
            if (event.data.some(val => listener[type].has(val.fieldName))) {
                return this.collectDeepChanges(event, listener, {
                    [event.entity.primary]: { eq: event.id },
                });
            }
        });
        await Promise.all(promises);
    }
    async junctionHandler(event) {
        const listeners = this.listenersStore.getJunctionListeners(event.owningEntity.name, event.owningRelation.name);
        const promises = listeners.map(listener => {
            const primary = listener.context.type === 'owning'
                ? event.owningId
                : event.inverseId;
            const entity = listener.context.entity;
            return this.collectDeepChanges(event, listener, {
                [entity.primary]: { eq: primary },
            });
        });
        await Promise.all(promises);
    }
    async collectDeepChanges(cause, listener, where) {
        const result = await this.changesFetcher.fetch(listener, where);
        for (const row of result) {
            this.payloadManager.add({
                listener,
                entity: listener.rootEntity,
                primary: row,
                cause,
            });
        }
    }
}
exports.TriggerHandler = TriggerHandler;
//# sourceMappingURL=TriggerHandler.js.map