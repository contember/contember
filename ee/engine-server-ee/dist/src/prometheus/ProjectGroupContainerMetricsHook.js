"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectGroupContainerMetricsHook = void 0;
const utils_1 = require("../utils");
class ProjectGroupContainerMetricsHook {
    constructor(containerResolver) {
        this.containerResolver = containerResolver;
    }
    register(promRegistry) {
        const registrar = (0, utils_1.createDbMetricsRegistrar)(promRegistry);
        this.containerResolver.onCreate.push((groupContainer, slug) => {
            groupContainer.projectContainerResolver.onCreate.push(projectContainer => registrar({
                connection: projectContainer.connection,
                labels: {
                    contember_module: 'content',
                    contember_project: projectContainer.project.slug,
                    contember_project_group: slug !== null && slug !== void 0 ? slug : 'unknown',
                },
            }));
            return registrar({
                connection: groupContainer.tenantContainer.connection,
                labels: {
                    contember_module: 'tenant',
                    contember_project_group: slug !== null && slug !== void 0 ? slug : 'unknown',
                    contember_project: 'unknown',
                },
            });
        });
    }
}
exports.ProjectGroupContainerMetricsHook = ProjectGroupContainerMetricsHook;
//# sourceMappingURL=ProjectGroupContainerMetricsHook.js.map