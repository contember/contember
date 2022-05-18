"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContainer = void 0;
const MasterContainer_1 = require("./MasterContainer");
const engine_server_1 = require("@contember/engine-server");
const createContainer = (args) => {
    return new MasterContainer_1.MasterContainerFactory(new engine_server_1.MasterContainerFactory()).create(args);
};
exports.createContainer = createContainer;
//# sourceMappingURL=index.js.map