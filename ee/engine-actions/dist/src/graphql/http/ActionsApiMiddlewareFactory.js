"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionsApiMiddlewareFactory = void 0;
const engine_http_1 = require("@contember/engine-http");
class ActionsApiMiddlewareFactory {
    constructor(debug, projectContextResolver, actionsGraphQLHandler) {
        this.debug = debug;
        this.projectContextResolver = projectContextResolver;
        this.actionsGraphQLHandler = actionsGraphQLHandler;
    }
    create() {
        return async (koaContext) => {
            const { request, response, state: { timer, params } } = koaContext;
            const { groupContainer, projectContainer, requestLogger, project, authResult } = await this.projectContextResolver.resolve(koaContext);
            const tenantContainer = groupContainer.tenantContainer;
            const memberships = await timer('MembershipFetch', () => tenantContainer.projectMemberManager.getEffectiveProjectMemberships(tenantContainer.databaseContext, { slug: project.slug }, {
                id: authResult.identityId,
                roles: authResult.roles,
            }));
            requestLogger.debug('Memberships fetched', { memberships });
            if (memberships.length === 0) {
                throw this.debug
                    ? new engine_http_1.HttpError(`You are not allowed to access project ${project.slug}`, 403)
                    : new engine_http_1.HttpError(`Project ${project.slug} NOT found`, 404);
            }
            const systemDatabase = projectContainer.systemDatabaseContextFactory.create();
            const schema = await projectContainer.contentSchemaResolver.getSchema(systemDatabase);
            await requestLogger.scope(async (logger) => {
                logger.debug('System query processing started');
                const graphqlContext = {
                    db: systemDatabase.client,
                    schema,
                };
                const handler = this.actionsGraphQLHandler;
                await timer('GraphQL', () => handler({
                    request,
                    response,
                    createContext: () => graphqlContext,
                }));
                logger.debug('System query finished');
            });
        };
    }
}
exports.ActionsApiMiddlewareFactory = ActionsApiMiddlewareFactory;
//# sourceMappingURL=ActionsApiMiddlewareFactory.js.map