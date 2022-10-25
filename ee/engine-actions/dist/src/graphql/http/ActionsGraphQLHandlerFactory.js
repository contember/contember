"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionsGraphQLHandlerFactory = void 0;
const merge_1 = require("@graphql-tools/merge");
const schema_1 = require("@graphql-tools/schema");
const engine_http_1 = require("@contember/engine-http");
const actions_graphql_1 = require("../schema/actions.graphql");
class ActionsGraphQLHandlerFactory {
    create(resolversFactory) {
        const mergedDefs = (0, merge_1.mergeTypeDefs)([actions_graphql_1.schema]);
        const resolvers = resolversFactory.create();
        const schema = (0, schema_1.makeExecutableSchema)({
            typeDefs: mergedDefs,
            resolvers,
        });
        return (0, engine_http_1.createGraphQLQueryHandler)({
            schema,
            listeners: [],
        });
    }
}
exports.ActionsGraphQLHandlerFactory = ActionsGraphQLHandlerFactory;
//# sourceMappingURL=ActionsGraphQLHandlerFactory.js.map