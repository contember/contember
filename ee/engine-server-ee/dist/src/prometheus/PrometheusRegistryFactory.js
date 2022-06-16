"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrometheusRegistryFactory = void 0;
const utils_1 = require("../utils");
const prom_client_1 = __importDefault(require("prom-client"));
const contemberEngineInfoMetric_1 = require("./contemberEngineInfoMetric");
class PrometheusRegistryFactory {
    constructor(processType, contemberEngineInfo) {
        this.processType = processType;
        this.contemberEngineInfo = contemberEngineInfo;
    }
    create() {
        if (this.processType === utils_1.ProcessType.clusterMaster) {
            const register = new prom_client_1.default.AggregatorRegistry();
            prom_client_1.default.collectDefaultMetrics({ register });
            return register;
        }
        const register = prom_client_1.default.register;
        register.registerMetric((0, contemberEngineInfoMetric_1.createContemberEngineInfoMetric)(this.contemberEngineInfo));
        prom_client_1.default.collectDefaultMetrics({ register });
        return register;
    }
}
exports.PrometheusRegistryFactory = PrometheusRegistryFactory;
//# sourceMappingURL=PrometheusRegistryFactory.js.map