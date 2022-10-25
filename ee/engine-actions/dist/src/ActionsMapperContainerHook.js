"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionsMapperContainerHook = void 0;
const triggers_1 = require("./triggers");
class ActionsMapperContainerHook {
    constructor(listenerStoreProvider) {
        this.listenerStoreProvider = listenerStoreProvider;
    }
    getHook() {
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
exports.ActionsMapperContainerHook = ActionsMapperContainerHook;
//# sourceMappingURL=ActionsMapperContainerHook.js.map