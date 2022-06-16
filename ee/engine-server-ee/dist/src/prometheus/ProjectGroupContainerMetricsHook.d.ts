import { ProjectGroupContainerResolver } from '../projectGroup/ProjectGroupContainerResolver'
import { Registry } from 'prom-client'
export declare class ProjectGroupContainerMetricsHook {
	private containerResolver
	constructor(containerResolver: ProjectGroupContainerResolver)
	register(promRegistry: Registry): void
}
//# sourceMappingURL=ProjectGroupContainerMetricsHook.d.ts.map
