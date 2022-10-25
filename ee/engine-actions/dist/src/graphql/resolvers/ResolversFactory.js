"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResolversFactory = void 0;
const graphql_utils_1 = require("@contember/graphql-utils");
class ResolversFactory {
    constructor(eventsQueryResolver, processBatchMutationResolver) {
        this.eventsQueryResolver = eventsQueryResolver;
        this.processBatchMutationResolver = processBatchMutationResolver;
    }
    create() {
        const resolvers = {
            Json: graphql_utils_1.JSONType,
            DateTime: graphql_utils_1.DateTimeType,
            Uuid: graphql_utils_1.UuidType,
            Mutation: {
                processBatch: this.processBatchMutationResolver.processBatch.bind(this.processBatchMutationResolver),
            },
            Query: {
                eventsInProcessing: this.eventsQueryResolver.eventsInProcessing.bind(this.eventsQueryResolver),
                eventsToProcess: this.eventsQueryResolver.eventsToProcess.bind(this.eventsQueryResolver),
                failedEvents: this.eventsQueryResolver.failedEvents.bind(this.eventsQueryResolver),
            },
        };
        return resolvers;
    }
}
exports.ResolversFactory = ResolversFactory;
//# sourceMappingURL=ResolversFactory.js.map