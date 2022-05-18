"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectGroupContainerResolver = void 0;
const engine_common_1 = require("@contember/engine-common");
const util_1 = require("util");
class ProjectGroupContainerResolver {
    constructor(configResolver, containerFactory) {
        this.configResolver = configResolver;
        this.containerFactory = containerFactory;
        this.containers = new engine_common_1.PromiseMap();
        this.onCreate = [];
    }
    async getProjectGroupContainer(slug, config = {}) {
        const existing = this.containers.get(slug);
        if (existing) {
            const existingAwaited = await existing;
            if ((0, util_1.isDeepStrictEqual)(config, existingAwaited.inputConfig)) {
                return existingAwaited.container;
            }
            existingAwaited.cleanups.forEach(it => it());
            this.containers.delete(slug);
        }
        return (await this.containers.fetch(slug, async (slug) => {
            const container = this.containerFactory.create({
                config: this.configResolver(slug, config),
                slug,
            });
            const cleanups = this.onCreate.map(it => it(container, slug) || (() => null));
            // eslint-disable-next-line no-console
            await container.tenantContainer.migrationsRunner.run(console.log);
            return { container, inputConfig: config, cleanups };
        })).container;
    }
}
exports.ProjectGroupContainerResolver = ProjectGroupContainerResolver;
//# sourceMappingURL=ProjectGroupContainerResolver.js.map