"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterContainerFactory = void 0;
const http_1 = require("./http");
const engine_http_1 = require("@contember/engine-http");
const crypto_1 = require("crypto");
const ProjectGroupContainerResolver_1 = require("./projectGroup/ProjectGroupContainerResolver");
const ProjectGroupResolver_1 = require("./projectGroup/ProjectGroupResolver");
const PrometheusRegistryFactory_1 = require("./prometheus/PrometheusRegistryFactory");
const ProjectGroupContainerMetricsHook_1 = require("./prometheus/ProjectGroupContainerMetricsHook");
class MasterContainerFactory {
    constructor(baseContainerFactory) {
        this.baseContainerFactory = baseContainerFactory;
    }
    createBuilder({ processType, serverConfig, ...args }) {
        return this.baseContainerFactory.createBuilder({ ...args, serverConfig })
            .addService('processType', () => processType)
            .addService('projectGroupContainerResolver', ({ tenantConfigResolver, projectGroupContainerFactory }) => new ProjectGroupContainerResolver_1.ProjectGroupContainerResolver(tenantConfigResolver, projectGroupContainerFactory))
            .addService('promRegistryFactory', ({ processType }) => new PrometheusRegistryFactory_1.PrometheusRegistryFactory(processType, { version: args.version }))
            .addService('projectGroupContainerMetricsHook', ({ projectGroupContainerResolver }) => new ProjectGroupContainerMetricsHook_1.ProjectGroupContainerMetricsHook(projectGroupContainerResolver))
            .addService('promRegistry', ({ promRegistryFactory, projectGroupContainerMetricsHook }) => {
            const registry = promRegistryFactory.create();
            projectGroupContainerMetricsHook.register(registry);
            return registry;
        })
            .replaceService('koaMiddlewares', ({ inner, promRegistry }) => {
            return (0, engine_http_1.compose)([
                (0, http_1.createColllectHttpMetricsMiddleware)(promRegistry),
                inner,
            ]);
        })
            .replaceService('projectGroupResolver', ({ projectGroupContainerResolver }) => {
            var _a, _b, _c, _d, _e;
            const encryptionKey = ((_a = serverConfig.projectGroup) === null || _a === void 0 ? void 0 : _a.configEncryptionKey)
                ? (0, crypto_1.createSecretKey)(Buffer.from((_b = serverConfig.projectGroup) === null || _b === void 0 ? void 0 : _b.configEncryptionKey, 'hex'))
                : undefined;
            return new ProjectGroupResolver_1.ProjectGroupResolver((_c = serverConfig.projectGroup) === null || _c === void 0 ? void 0 : _c.domainMapping, (_d = serverConfig.projectGroup) === null || _d === void 0 ? void 0 : _d.configHeader, ((_e = serverConfig.projectGroup) === null || _e === void 0 ? void 0 : _e.configEncryptionKey) ? new engine_http_1.CryptoWrapper(encryptionKey) : undefined, projectGroupContainerResolver);
        })
            .addService('monitoringKoa', ({ promRegistry }) => {
            const app = new engine_http_1.Koa();
            app.use((0, http_1.createShowMetricsMiddleware)(promRegistry));
            return app;
        });
    }
    create(args) {
        const container = this.createBuilder(args).build();
        return container.pick('initializer', 'koa', 'monitoringKoa', 'providers');
    }
}
exports.MasterContainerFactory = MasterContainerFactory;
//# sourceMappingURL=MasterContainer.js.map