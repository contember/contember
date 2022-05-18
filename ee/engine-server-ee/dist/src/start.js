#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const loadPlugins_1 = __importDefault(require("./loadPlugins"));
const os_1 = __importDefault(require("os"));
const cluster_1 = __importDefault(require("cluster"));
const utils_1 = require("./utils");
const engine_server_1 = require("@contember/engine-server");
const configSchema_1 = require("./config/configSchema");
(async () => {
    var _a;
    if (process.env.NODE_HEAPDUMP === 'true') {
        // eslint-disable-next-line no-console
        console.log('Initializing heapdump');
        await Promise.resolve().then(() => __importStar(require('heapdump')));
    }
    const isDebug = (0, engine_server_1.isDebugMode)();
    const version = (0, engine_server_1.getServerVersion)();
    (0, engine_server_1.printStartInfo)({ version, isDebug });
    const plugins = await (0, loadPlugins_1.default)();
    const { serverConfig, projectConfigResolver, tenantConfigResolver } = await (0, engine_server_1.resolveServerConfig)({ plugins, serverConfigSchema: configSchema_1.serverConfigSchema });
    if (process.argv[2] === 'validate') {
        process.exit(0);
    }
    (0, engine_server_1.initSentry)((_a = serverConfig.logging.sentry) === null || _a === void 0 ? void 0 : _a.dsn);
    const workerConfig = serverConfig.workerCount || 1;
    const workerCount = workerConfig === 'auto' ? os_1.default.cpus().length : Number(workerConfig);
    const isClusterMode = workerCount > 1;
    const processType = (0, utils_1.getClusterProcessType)(isClusterMode);
    const container = (0, index_1.createContainer)({
        debugMode: isDebug,
        serverConfig,
        projectConfigResolver,
        tenantConfigResolver,
        plugins,
        processType,
        version,
    });
    let initializedProjects = [];
    const terminationJobs = [];
    (0, engine_server_1.listenOnProcessTermination)(terminationJobs);
    if (cluster_1.default.isMaster) {
        const monitoringPort = serverConfig.monitoringPort;
        const monitoringServer = container.monitoringKoa.listen(monitoringPort, () => {
            // eslint-disable-next-line no-console
            console.log(`Monitoring running on http://localhost:${monitoringPort}`);
        });
        terminationJobs.push(async () => {
            await new Promise(resolve => monitoringServer.close(resolve));
            // eslint-disable-next-line no-console
            console.log('Monitoring server terminated');
        });
        if (!serverConfig.projectGroup) {
            initializedProjects = await container.initializer.initialize();
        }
    }
    const port = serverConfig.port;
    const printStarted = () => {
        if (serverConfig.projectGroup) {
            // eslint-disable-next-line no-console
            console.log('Contember Cloud running');
        }
        else {
            // eslint-disable-next-line no-console
            console.log(`Contember API running on http://localhost:${port}`);
            // eslint-disable-next-line no-console
            console.log(initializedProjects.length ? `Initialized projects: ${initializedProjects.join(', ')}` : 'No project initialized');
        }
    };
    if (isClusterMode) {
        if (cluster_1.default.isMaster) {
            // eslint-disable-next-line no-console
            console.log(`Master ${process.pid} is running`);
            const workerManager = new utils_1.WorkerManager(workerCount);
            terminationJobs.push(async ({ signal }) => {
                await workerManager.terminate(signal);
                // eslint-disable-next-line no-console
                console.log('Workers terminated');
            });
            await workerManager.start();
            printStarted();
        }
        else {
            // eslint-disable-next-line no-console
            console.log(`Starting worker ${process.pid}`);
            // this line somehow ensures, that worker waits for termination of all jobs
            process.on('disconnect', () => (0, utils_1.timeout)(0));
            const httpServer = container.koa.listen(port, () => (0, utils_1.notifyWorkerStarted)());
            terminationJobs.push(async () => {
                await new Promise(resolve => httpServer.close(resolve));
                // eslint-disable-next-line no-console
                console.log('API server terminated');
            });
        }
    }
    else {
        const httpServer = container.koa.listen(port, () => printStarted());
        terminationJobs.push(async () => {
            await new Promise(resolve => httpServer.close(resolve));
            // eslint-disable-next-line no-console
            console.log('API server terminated');
        });
    }
})().catch(e => {
    // eslint-disable-next-line no-console
    console.log(e);
    process.exit(1);
});
//# sourceMappingURL=start.js.map