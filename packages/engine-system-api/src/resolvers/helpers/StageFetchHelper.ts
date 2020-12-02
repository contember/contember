import { DatabaseContext } from '../../model/database'
import { ProjectConfig } from '../../types'
import { StageBySlugQuery } from '../../model/queries'
import { StageWithId } from '../../model/dtos'
import { ShouldNotHappenException } from '../../utils'

export const fetchStages = async (
	stage: string,
	db: DatabaseContext,
	project: ProjectConfig,
): Promise<FetchStageResult> => {
	const headStageConfig = project.stages.find(it => it.slug === stage)
	if (!headStageConfig) {
		return new FetchStageErrorResponse(FetchStageErrors.headNotFound, `Stage ${stage} not found`)
	}
	if (!headStageConfig.base) {
		return new FetchStageErrorResponse(FetchStageErrors.missingBase, `Stage ${stage} is a root stage`)
	}
	const [baseStage, headStage] = await Promise.all([
		db.queryHandler.fetch(new StageBySlugQuery(headStageConfig.base)),
		db.queryHandler.fetch(new StageBySlugQuery(headStageConfig.slug)),
	])

	if (!baseStage || !headStage) {
		throw new ShouldNotHappenException()
	}

	return new FetchStageOkResponse(headStage, baseStage)
}

export type FetchStageResult = FetchStageErrorResponse | FetchStageOkResponse

export enum FetchStageErrors {
	headNotFound = 'headNotFound',
	missingBase = 'missingBase',
}

export class FetchStageErrorResponse {
	public readonly ok = false

	constructor(public readonly error: FetchStageErrors, public readonly message?: string) {}
}

export class FetchStageOkResponse {
	public readonly ok = true

	constructor(public readonly head: StageWithId, public readonly base: StageWithId) {}
}
