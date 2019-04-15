import Project from '../../src/config/Project'
import CreateOrUpdateStageCommand from '../../src/system-api/model/commands/CreateOrUpdateStageCommand'
import FileNameHelper from '../../src/migrations/FileNameHelper'
import KnexWrapper from '../../src/core/knex/KnexWrapper'
import LatestMigrationByStageQuery from '../../src/system-api/model/queries/LatestMigrationByStageQuery'
import StageMigrator from '../../src/system-api/StageMigrator'

export default class TesterStageManager {
	private knownStages: { [stageSlug: string]: Project.Stage & { migration?: string } } = {}

	constructor(private readonly db: KnexWrapper, private readonly stageMigrator: StageMigrator) {}

	public getStage(slug: string): Project.Stage & { migration?: string } {
		const stage = this.knownStages[slug]
		if (!stage) {
			throw new Error(`Unknown stage ${stage}`)
		}
		return stage
	}

	public async createStage(stage: Project.Stage): Promise<void> {
		await new CreateOrUpdateStageCommand({
			id: stage.uuid,
			...stage,
		}).execute(this.db)
		this.knownStages[stage.slug] = stage
	}

	public async migrateStage(slug: string, version: string): Promise<void> {
		version = FileNameHelper.extractVersion(version)
		const stageMigrator = this.stageMigrator
		const stage = this.getStage(slug)
		await stageMigrator.migrate({ ...stage }, () => null, version)
		this.knownStages[slug] = { ...stage, migration: version }
	}

	public async refreshStagesVersion() {
		const queryHandler = this.db.createQueryHandler()
		for (let stage in this.knownStages) {
			const stageObj = this.knownStages[stage]
			const latestMigration = await queryHandler.fetch(new LatestMigrationByStageQuery(stageObj.uuid))
			this.knownStages[stage] = {
				...stageObj,
				migration: latestMigration ? latestMigration.data.version : undefined,
			}
		}
	}
}
