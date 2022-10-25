"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListenerStoreProvider = exports.ActionsExecutionContainerHookFactory = exports.TriggerIndirectChangesFetcher = exports.TriggerPayloadManager = exports.TriggerHandler = exports.TriggerListenersStore = exports.TriggerListenersFactory = void 0;
const migrations_1 = require("./migrations");
const ActionsExecutionContainerHookFactory_1 = require("./ActionsExecutionContainerHookFactory");
const ListenerStoreProvider_1 = require("./ListenerStoreProvider");
const ActionsApiMiddlewareFactory_1 = require("./graphql/http/ActionsApiMiddlewareFactory");
const ActionsGraphQLHandlerFactory_1 = require("./graphql/http/ActionsGraphQLHandlerFactory");
const ResolversFactory_1 = require("./graphql/resolvers/ResolversFactory");
const resolvers_1 = require("./graphql/resolvers");
const EventDispatcher_1 = require("./dispatch/EventDispatcher");
const EventsRepository_1 = require("./dispatch/EventsRepository");
const TargetHandlerResolver_1 = require("./dispatch/TargetHandlerResolver");
const WebhookTargetHandler_1 = require("./dispatch/WebhookTargetHandler");
var triggers_1 = require("./triggers");
Object.defineProperty(exports, "TriggerListenersFactory", { enumerable: true, get: function () { return triggers_1.TriggerListenersFactory; } });
Object.defineProperty(exports, "TriggerListenersStore", { enumerable: true, get: function () { return triggers_1.TriggerListenersStore; } });
Object.defineProperty(exports, "TriggerHandler", { enumerable: true, get: function () { return triggers_1.TriggerHandler; } });
Object.defineProperty(exports, "TriggerPayloadManager", { enumerable: true, get: function () { return triggers_1.TriggerPayloadManager; } });
Object.defineProperty(exports, "TriggerIndirectChangesFetcher", { enumerable: true, get: function () { return triggers_1.TriggerIndirectChangesFetcher; } });
var ActionsExecutionContainerHookFactory_2 = require("./ActionsExecutionContainerHookFactory");
Object.defineProperty(exports, "ActionsExecutionContainerHookFactory", { enumerable: true, get: function () { return ActionsExecutionContainerHookFactory_2.ActionsExecutionContainerHookFactory; } });
var ListenerStoreProvider_2 = require("./ListenerStoreProvider");
Object.defineProperty(exports, "ListenerStoreProvider", { enumerable: true, get: function () { return ListenerStoreProvider_2.ListenerStoreProvider; } });
class ActionsPlugin {
    constructor() {
        this.name = 'contember/actions';
    }
    getSystemMigrations() {
        return migrations_1.migrationsGroup;
    }
    getExecutionContainerHook() {
        const hookFactory = new ActionsExecutionContainerHookFactory_1.ActionsExecutionContainerHookFactory(new ListenerStoreProvider_1.ListenerStoreProvider());
        return hookFactory.create();
    }
    getMasterContainerHook() {
        const hook = builder => {
            return builder
                .setupService('router', (it, { projectContextResolver, debugMode, logger }) => {
                const handlerFactory = new ActionsGraphQLHandlerFactory_1.ActionsGraphQLHandlerFactory();
                const eventsRepository = new EventsRepository_1.EventsRepository();
                const webhookTargetHandler = new WebhookTargetHandler_1.WebhookTargetHandler();
                const targetHandlerResolver = new TargetHandlerResolver_1.TargetHandlerResolver(webhookTargetHandler);
                const eventDispatcher = new EventDispatcher_1.EventDispatcher(eventsRepository, targetHandlerResolver);
                const eventsQueryResolver = new resolvers_1.EventsQueryResolver();
                const processBatchMutationResolver = new resolvers_1.ProcessBatchMutationResolver(eventDispatcher);
                const resolversFactory = new ResolversFactory_1.ResolversFactory(eventsQueryResolver, processBatchMutationResolver);
                const actionsMiddlewareFactory = new ActionsApiMiddlewareFactory_1.ActionsApiMiddlewareFactory(debugMode, projectContextResolver, handlerFactory.create(resolversFactory));
                it.add('actions', '/actions/:projectSlug$', actionsMiddlewareFactory.create());
            });
        };
        return hook;
    }
}
exports.default = ActionsPlugin;
//# sourceMappingURL=index.js.map