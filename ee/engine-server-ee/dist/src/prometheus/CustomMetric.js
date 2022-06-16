"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomMetric = void 0;
class CustomMetric {
    constructor(options) {
        this.options = options;
        this.values = [];
    }
    reset() {
        this.values = [];
    }
    add(labels, value) {
        this.values.push({ labels, value });
    }
    get name() {
        return this.options.name;
    }
    get() {
        return {
            help: this.options.help,
            name: this.options.name,
            type: this.options.type,
            values: this.values,
            aggregator: 'sum',
        };
    }
}
exports.CustomMetric = CustomMetric;
//# sourceMappingURL=CustomMetric.js.map