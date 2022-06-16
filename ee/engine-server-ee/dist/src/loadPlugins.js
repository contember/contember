"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const engine_s3_plugin_1 = __importDefault(require("@contember/engine-s3-plugin"));
const engine_vimeo_plugin_1 = __importDefault(require("@contember/engine-vimeo-plugin"));
function loadPlugins() {
    return Promise.resolve([new engine_s3_plugin_1.default(), new engine_vimeo_plugin_1.default()]);
}
exports.default = loadPlugins;
//# sourceMappingURL=loadPlugins.js.map