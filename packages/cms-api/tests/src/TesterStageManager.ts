import Project from '../../src/config/Project'
import FileNameHelper from '../../src/migrations/FileNameHelper'
import KnexWrapper from '../../src/core/knex/KnexWrapper'
import StageCreator from '../../src/system-api/model/stages/StageCreator'
import ProjectMigrator from '../../src/system-api/model/migrations/ProjectMigrator'
import Migration from '../../src/system-api/model/migrations/Migration'
import MigrationsResolver from '../../src/content-schema/MigrationsResolver'

export default class TesterStageManager {
	private createdStages = new Set<string>()

	private migrationVersion: string | null = null

	constructor(
		private readonly stages: Project.Stage[],
		private readonly db: KnexWrapper,
		private readonly stageCreator: StageCreator,
		private readonly projectMigrator: ProjectMigrator,
		private readonly migrationResolver: MigrationsResolver
	) {}

	public getStage(slug: string): Project.Stage & { migration?: string; id: string } {
		const stage = this.getStageInternal(slug)
		if (!this.createdStages.has(slug)) {
			throw new Error(`Stage ${slug} is not created yet`)
		}
		return stage
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
		await this.stageCreator.createStage(stage.rebaseOn ? this.getStage(stage.rebaseOn) : null, {
			...stage,
			id: stage.uuid,
		})
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

	private getStageInternal(slug: string): Project.Stage & { migration?: string; id: string } {
		const stage = this.stages.find(it => it.slug === slug)
		if (!stage) {
			throw new Error(`Unknown stage ${stage}`)
		}
		return { ...stage, id: stage.uuid }
	}
}
