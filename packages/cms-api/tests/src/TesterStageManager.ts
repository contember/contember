import Project from '../../src/config/Project'
import FileNameHelper from '../../src/migrations/FileNameHelper'
import Client from '../../src/core/database/Client'
import StageCreator from '../../src/system-api/model/stages/StageCreator'
import ProjectMigrator from '../../src/system-api/model/migrations/ProjectMigrator'
import Migration from '../../src/system-api/model/migrations/Migration'
import MigrationsResolver from '../../src/content-schema/MigrationsResolver'
import LatestMigrationByStageQuery from '../../src/system-api/model/queries/LatestMigrationByStageQuery'

export default class TesterStageManager {
	private createdStages = new Set<string>()

	private migrationVersion: string | null = null

	constructor(
		private readonly stages: Project.Stage[],
		private readonly db: Client,
		private readonly stageCreator: StageCreator,
		private readonly projectMigrator: ProjectMigrator,
		private readonly migrationResolver: MigrationsResolver
	) {}

	public getStage(slug: string): Project.Stage {
		const stage = this.getStageInternal(slug)
		if (!this.createdStages.has(slug)) {
			throw new Error(`Stage ${slug} is not created yet`)
		}
		return stage
	}

	public async refreshCreatedStages(): Promise<Set<string>> {
		const stages = await this.db
			.selectBuilder<{ slug: string; id: string }>()
			.select('slug')
			.select('id')
			.from('stage')
			.getResult()

		this.createdStages = new Set(stages.map(it => it.slug))
		if (stages.length > 0) {
			const latestVersion = await this.db.createQueryHandler().fetch(new LatestMigrationByStageQuery(stages[0].id))
			this.migrationVersion = latestVersion ? latestVersion.data.version : null
		}

		return this.createdStages
	}

	public getMigrationVersion() {
		return this.migrationVersion
	}

	public async createAll(): Promise<void> {
		for (const stage of this.stages) {
			await this.createStage(stage.slug)
		}
	}

	public async createStage(slug: string): Promise<void> {
		const stage = this.getStageInternal(slug)
		await this.stageCreator.createStage(stage.base ? this.getStage(stage.base) : null, stage)
		this.createdStages.add(slug)
	}

	public async migrate(migration: string | Migration): Promise<void> {
		if (typeof migration === 'string') {
			const version = FileNameHelper.extractVersion(migration)
			const resolvedMigration = (await this.migrationResolver.getMigrations()).find(it => it.version === version)
			if (!resolvedMigration) {
				throw new Error(`Migration ${migration} not found`)
			}
			migration = resolvedMigration
		}
		await this.projectMigrator.migrate(this.migrationVersion, [migration], () => null)
		this.migrationVersion = FileNameHelper.extractVersion(migration.version)
	}

	private getStageInternal(slug: string): Project.Stage {
		const stage = this.stages.find(it => it.slug === slug)
		if (!stage) {
			throw new Error(`Unknown stage ${slug}`)
		}
		return stage
	}
}
