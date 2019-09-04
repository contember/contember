import { StageWithoutEvent } from '../dtos/Stage'
import { ProjectConfig, StageConfig } from '../../types'

class StageTree {
	constructor(private readonly root: StageConfig, private readonly childMap: StageTree.Map) {}

	public getRoot(): StageConfig {
		return this.root
	}

	public getChildren(stage: StageWithoutEvent): StageConfig[] {
		return this.childMap[stage.slug] || []
	}
}

namespace StageTree {
	export type Map = { [parent: string]: StageConfig[] }

	export class Factory {
		public create(project: ProjectConfig): StageTree {
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
