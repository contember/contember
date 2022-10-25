"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionsExecutionContainerHookFactory = void 0;
const triggers_1 = require("./triggers");
const TriggerPayloadBuilder_1 = require("./triggers/TriggerPayloadBuilder");
const TriggerPayloadPersister_1 = require("./triggers/TriggerPayloadPersister");
class ActionsExecutionContainerHookFactory {
    constructor(listenerStoreProvider) {
        this.listenerStoreProvider = listenerStoreProvider;
    }
    create() {
        return builder => {
            return builder.setupService('mapperFactory', (mapperFactory, { whereBuilder, schema, pathFactory, systemSchema, providers, stage }) => {
                mapperFactory.hooks.push(mapper => {
                    const triggerPayloadPersister = new TriggerPayloadPersister_1.TriggerPayloadPersister(mapper, mapper.db.forSchema(systemSchema), providers, stage.id, schema.id);
                    const triggerPayloadBuilder = new TriggerPayloadBuilder_1.TriggerPayloadBuilder(mapper);
                    const payloadManager = new triggers_1.TriggerPayloadManager(triggerPayloadBuilder, triggerPayloadPersister);
                    const changesFetcher = new triggers_1.TriggerIndirectChangesFetcher(mapper, whereBuilder, pathFactory);
                    const listenersStore = this.listenerStoreProvider.getListenerStore(schema);
                    const triggerHandler = new triggers_1.TriggerHandler(payloadManager, listenersStore, changesFetcher);
                    triggerHandler.attach(mapper.eventManager);
                });
            });
        };
    }
}
exports.ActionsExecutionContainerHookFactory = ActionsExecutionContainerHookFactory;
//# sourceMappingURL=ActionsExecutionContainerHookFactory.js.map