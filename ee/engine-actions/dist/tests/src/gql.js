"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gql = void 0;
const assert_1 = __importDefault(require("assert"));
// Used to allow prettier formatting of GraphQL queries
const gql = (strings) => {
    assert_1.default.strictEqual(strings.length, 1);
    return strings[0];
};
exports.gql = gql;
//# sourceMappingURL=gql.js.map