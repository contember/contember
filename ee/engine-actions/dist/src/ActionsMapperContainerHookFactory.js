"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionsMapperContainerHookFactory = void 0;
const triggers_1 = require("./triggers");
class ActionsMapperContainerHookFactory {
    constructor(listenerStoreProvider) {
        this.listenerStoreProvider = listenerStoreProvider;
    }
    create() {
        return builder => {
            return builder.setupService('mapperFactory', (mapperFactory, { whereBuilder, schema, pathFactory }) => {
                mapperFactory.hooks.push(mapper => {
                    const payloadBuilder = new triggers_1.TriggerPayloadBuilder(mapper);
                    const dispatcher = new class {
                        dispatch(payloads) {
                            return Promise.resolve(undefined);
                        }
                    };
                    const changesFetcher = new triggers_1.TriggerIndirectChangesFetcher(mapper, whereBuilder, pathFactory);
                    const listenersStore = this.listenerStoreProvider.getListenerStore(schema);
                    const triggerHandler = new triggers_1.TriggerHandler(payloadBuilder, listenersStore, dispatcher, changesFetcher);
                    triggerHandler.attach(mapper.eventManager);
                });
            });
        };
    }
}
exports.ActionsMapperContainerHookFactory = ActionsMapperContainerHookFactory;
//# sourceMappingURL=ActionsMapperContainerHookFactory.js.map