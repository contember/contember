import { StageWithoutEvent } from '../dtos/Stage'
import { ProjectConfig, StageConfig } from '../../types'

export class StageTree {
	constructor(private readonly root: StageConfig, private readonly childMap: StageTreeMap) {}

	public getRoot(): StageConfig {
		return this.root
	}

	public getChildren(stage: StageWithoutEvent): StageConfig[] {
		return this.childMap[stage.slug] || []
	}
}

export const createStageTree = (project: Pick<ProjectConfig, 'stages'>): StageTree => {
	const rootStages = project.stages.filter(it => !it.base)
	if (rootStages.length !== 1) {
		throw new Error(`Exactly 1 root stage expected, ${rootStages.length} found`)
	}
	const rootStage = rootStages[0]
	const stages = project.stages
		.filter(it => it.base)
		.reduce<StageTreeMap>(
			(acc, stage) => ({
				...acc,
				[stage.base!]: [...(acc[stage.base!] || []), stage],
			}),
			{},
		)
	return new StageTree(rootStage, stages)
}
export type StageTreeMap = { [parent: string]: StageConfig[] }
