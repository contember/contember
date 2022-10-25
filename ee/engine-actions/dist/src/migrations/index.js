"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrationsGroup = void 0;
const snapshot_1 = __importDefault(require("./snapshot"));
const database_migrations_1 = require("@contember/database-migrations");
exports.migrationsGroup = new database_migrations_1.MigrationGroup(snapshot_1.default, {});
//# sourceMappingURL=index.js.map