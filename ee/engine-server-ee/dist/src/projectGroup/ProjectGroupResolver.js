"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectGroupResolver = void 0;
const engine_http_1 = require("@contember/engine-http");
class ProjectGroupResolver {
    constructor(projectGroupDomainMapping, projectGroupConfigHeader, projectGroupConfigCrypto, projectGroupContainerResolver) {
        this.projectGroupDomainMapping = projectGroupDomainMapping;
        this.projectGroupConfigCrypto = projectGroupConfigCrypto;
        this.projectGroupContainerResolver = projectGroupContainerResolver;
        this.groupRegex = (this.projectGroupDomainMapping
            ? new RegExp(this.projectGroupDomainMapping.includes('{group}')
                ? regexpQuote(this.projectGroupDomainMapping).replace(regexpQuote('{group}'), '([^.]+)')
                : this.projectGroupDomainMapping)
            : undefined);
        this.projectGroupConfigHeader = projectGroupConfigHeader === null || projectGroupConfigHeader === void 0 ? void 0 : projectGroupConfigHeader.toLowerCase();
    }
    async resolveContainer({ request }) {
        var _a;
        let group = undefined;
        let config = {};
        if (this.groupRegex) {
            const match = request.host.match(this.groupRegex);
            if (!match) {
                throw new engine_http_1.HttpError('Project group not found', 404);
            }
            group = match[1];
            if (this.projectGroupConfigHeader) {
                const configHeader = request.get(this.projectGroupConfigHeader.toLowerCase());
                if (configHeader === '') {
                    throw new engine_http_1.HttpError(`${this.projectGroupConfigHeader} header is missing`, 400);
                }
                const configValue = Buffer.from(configHeader, 'base64');
                const decryptedValue = this.projectGroupConfigCrypto
                    ? (await ((_a = this.projectGroupConfigCrypto) === null || _a === void 0 ? void 0 : _a.decrypt(configValue, engine_http_1.CryptoWrapper.cryptoVersion))).value
                    : configValue;
                try {
                    config = JSON.parse(decryptedValue.toString());
                }
                catch (e) {
                    throw new engine_http_1.HttpError(`Cannot parse config: ${e.message}`, 400);
                }
            }
        }
        return await this.projectGroupContainerResolver.getProjectGroupContainer(group, config);
    }
}
exports.ProjectGroupResolver = ProjectGroupResolver;
const regexpQuote = (regexp) => regexp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
//# sourceMappingURL=ProjectGroupResolver.js.map