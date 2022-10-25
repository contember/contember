"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertNever = void 0;
function assertNever(_, formatUnhandledDiscriminator) {
    throw new Error(`Unhandled case ${formatUnhandledDiscriminator === null || formatUnhandledDiscriminator === void 0 ? void 0 : formatUnhandledDiscriminator(_)}`);
}
exports.assertNever = assertNever;
//# sourceMappingURL=assertNever.js.map