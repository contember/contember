"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContemberEngineInfoMetric = void 0;
const prom_client_1 = require("prom-client");
const createContemberEngineInfoMetric = ({ version = 'unknown' }) => {
    const contemberEngineInfo = new prom_client_1.Gauge({
        help: 'Contember engine info',
        name: 'contember_info',
        labelNames: ['version'],
    });
    contemberEngineInfo.set({ version }, 1);
    return contemberEngineInfo;
};
exports.createContemberEngineInfoMetric = createContemberEngineInfoMetric;
//# sourceMappingURL=contemberEngineInfoMetric.js.map