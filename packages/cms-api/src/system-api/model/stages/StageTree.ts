import { StageWithoutEvent } from '../dtos/Stage'
import Project from '../../../config/Project'

class StageTree {
	constructor(
		private readonly root: StageWithoutEvent,
		private readonly childMap: StageTree.Map
	) {

	}

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
			const rootStage = project.stages.find(it => !it.rebaseOn)
			if (!rootStage) {
				throw new Error('Root stage is not defined')
			}
			const stages = project.stages
				.filter((it) => it.rebaseOn)
				.reduce<Map>((acc, stage) => ({ ...acc, [stage.rebaseOn!]: [...(acc[stage.rebaseOn!] || []), { ...stage, id: stage.uuid }] }), {})
			return new StageTree({ ...rootStage, id: rootStage.uuid }, stages)
		}
	}
}

export default StageTree
