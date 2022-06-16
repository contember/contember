"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDbMetricsRegistrar = void 0;
const prom_client_1 = __importDefault(require("prom-client"));
const database_1 = require("@contember/database");
const CustomMetric_1 = require("./CustomMetric");
const labelNames = ['contember_project', 'contember_module', 'contember_project_group'];
const createDbMetricsRegistrar = (registry) => {
    const dbPoolCollectorInner = createDbPoolMetricsCollector(registry);
    const entries = new Set();
    const collector = () => {
        dbPoolCollectorInner(entries);
    };
    registry.registerCollector(collector);
    const sqlMetricsRegistrar = createSqlMetricsRegistrar(registry);
    return entry => {
        entries.add(entry);
        const sqlMetricsUnregistrar = sqlMetricsRegistrar(entry.connection, entry.labels);
        return () => {
            entries.delete(entry);
            sqlMetricsUnregistrar();
        };
    };
};
exports.createDbMetricsRegistrar = createDbMetricsRegistrar;
const createDbPoolMetricsCollector = (registry) => {
    const descriptionSuffix = 'Dimensions: contember_module (tenant or content; system is not used since it uses the same connection), contember_project_group and contember_project for contember_module=content.';
    const totalCount = new prom_client_1.default.Gauge({
        registers: [registry],
        name: `contember_db_pool_total_count`,
        help: `The total number of clients existing within the pool: ${descriptionSuffix}`,
        labelNames,
    });
    const idleCount = new prom_client_1.default.Gauge({
        registers: [registry],
        name: `contember_db_pool_idle_count`,
        help: `The number of clients which are not checked out but are currently idle in the pool. ${descriptionSuffix}`,
        labelNames,
    });
    const waitingCount = new prom_client_1.default.Gauge({
        registers: [registry],
        name: `contember_db_pool_waiting_count`,
        help: `The number of queued requests waiting on a client when all clients are checked out. It can be helpful to monitor this number to see if you need to adjust the size of the pool. ${descriptionSuffix}`,
        labelNames,
    });
    const maxCount = new prom_client_1.default.Gauge({
        registers: [registry],
        name: `contember_db_pool_max_count`,
        help: `Maximum number of clients the pool should contain. ${descriptionSuffix}`,
        labelNames,
    });
    const connectingCount = new prom_client_1.default.Gauge({
        registers: [registry],
        name: `contember_db_pool_connecting_count`,
        help: `Current value of clients establishing connection. ${descriptionSuffix}`,
        labelNames,
    });
    const activeCount = new prom_client_1.default.Gauge({
        registers: [registry],
        name: `contember_db_pool_active_count`,
        help: `Number of connections that are checked out. ${descriptionSuffix}`,
        labelNames,
    });
    const statCounters = {};
    for (const [key, description] of Object.entries(database_1.poolStatsDescription)) {
        const customMetric = new CustomMetric_1.CustomMetric({
            name: `contember_db_pool_${key}`,
            help: `${description} ${descriptionSuffix}`,
            type: 'counter',
            labelNames,
        });
        statCounters[key] = customMetric;
        registry.registerMetric(customMetric);
    }
    return (entries) => {
        for (const counter of Object.values(statCounters)) {
            counter.reset();
        }
        for (const entry of entries) {
            const db = entry.connection;
            const labels = entry.labels;
            const poolInfo = db.getPoolStatus();
            if (!poolInfo) {
                return;
            }
            totalCount.set(labels, poolInfo.active + poolInfo.idle + poolInfo.connecting);
            idleCount.set(labels, poolInfo.idle);
            waitingCount.set(labels, poolInfo.pending);
            maxCount.set(labels, poolInfo.max);
            connectingCount.set(labels, poolInfo.connecting);
            activeCount.set(labels, poolInfo.active);
            for (const [key, value] of Object.entries(poolInfo.stats)) {
                statCounters[key].add(labels, value);
            }
        }
    };
};
const createSqlMetricsRegistrar = (registry) => {
    const sqlDuration = new prom_client_1.default.Histogram({
        name: 'contember_sql_duration_ms',
        help: 'Executed SQL queries by contember_module (system, tenant, content or unknown) and contember_project (or "unknown" for unknown project)',
        registers: [registry],
        labelNames,
        buckets: [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000],
    });
    const sqlErrorRate = new prom_client_1.default.Counter({
        name: 'contember_sql_error_count',
        help: 'Failed SQL queries by contember_module (system, tenant, content or unknown) and contember_project (or "unknown" for unknown project)',
        labelNames,
        registers: [registry],
    });
    return (connection, labels) => {
        const queryEndCallback = ({ meta }, { timing }) => {
            sqlDuration.observe({
                ...labels,
                contember_module: meta.module || labels.contember_module,
            }, timing ? timing.selfDuration / 1000 : 0);
        };
        const queryErrorCallback = ({ meta }) => {
            sqlErrorRate.inc({
                ...labels,
                contember_module: meta.module || labels.contember_module,
            });
        };
        connection.eventManager.on(database_1.EventManager.Event.queryEnd, queryEndCallback);
        connection.eventManager.on(database_1.EventManager.Event.queryError, queryErrorCallback);
        return () => {
            connection.eventManager.removeListener(database_1.EventManager.Event.queryEnd, queryEndCallback);
            connection.eventManager.removeListener(database_1.EventManager.Event.queryError, queryErrorCallback);
        };
    };
};
//# sourceMappingURL=dbMetrics.js.map