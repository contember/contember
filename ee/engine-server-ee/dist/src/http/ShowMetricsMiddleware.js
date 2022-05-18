"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createShowMetricsMiddleware = void 0;
const engine_http_1 = require("@contember/engine-http");
const prom_client_1 = __importDefault(require("prom-client"));
const createShowMetricsMiddleware = (registry) => {
    return (0, engine_http_1.route)('/metrics', async (ctx) => {
        if (registry instanceof prom_client_1.default.AggregatorRegistry) {
            ctx.body = await registry.clusterMetrics();
        }
        else {
            ctx.body = registry.metrics();
        }
    });
};
exports.createShowMetricsMiddleware = createShowMetricsMiddleware;
//# sourceMappingURL=ShowMetricsMiddleware.js.map