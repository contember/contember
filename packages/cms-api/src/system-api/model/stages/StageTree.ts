import { StageWithoutEvent } from '../dtos/Stage'
import Project from '../../../config/Project'

class StageTree {
	constructor(private readonly root: StageWithoutEvent, private readonly childMap: StageTree.Map) {}

	public getRoot(): StageWithoutEvent {
		return this.root
	}

	public getChildren(stage: StageWithoutEvent): StageWithoutEvent[] {
		return this.childMap[stage.slug] || []
	}
}

namespace StageTree {
	export type Map = { [parent: string]: StageWithoutEvent[] }

	export class Factory {
		public create(project: Project): StageTree {
			const rootStages = project.stages.filter(it => !it.base)
			if (rootStages.length !== 1) {
				throw new Error(`Exactly 1 root stage expected, ${rootStages.length} found`)
			}
			const rootStage = rootStages[0]
			const stages = project.stages
				.filter(it => it.base)
				.reduce<Map>(
					(acc, stage) => ({
						...acc,
						[stage.base!]: [...(acc[stage.base!] || []), stage],
					}),
					{},
				)
			return new StageTree(rootStage, stages)
		}
	}
}

export default StageTree
