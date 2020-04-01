import { SelectBuilder } from '@contember/database'
import {
	DatabaseContext,
	MigrationsResolver,
	ProjectMigrator,
	StageConfig,
	StageCreator,
} from '@contember/engine-system-api'
import { Migration, MigrationVersionHelper } from '@contember/schema-migrations'

export class TesterStageManager {
	private createdStages = new Set<string>()

	constructor(
		private readonly stages: StageConfig[],
		private readonly db: DatabaseContext,
		private readonly stageCreator: StageCreator,
		private readonly projectMigrator: ProjectMigrator,
		private readonly migrationResolver: MigrationsResolver,
	) {}

	public getStage(slug: string): StageConfig {
		const stage = this.getStageInternal(slug)
		if (!this.createdStages.has(slug)) {
			throw new Error(`Stage ${slug} is not created yet`)
		}
		return stage
	}

	public async refreshCreatedStages(): Promise<Set<string>> {
		const stages = await SelectBuilder.create<{ slug: string }>()
			.select('slug')
			.from('stage')
			.getResult(this.db.client)

		this.createdStages = new Set(stages.map(it => it.slug))

		return this.createdStages
	}

	public async createAll(): Promise<void> {
		for (const stage of this.stages) {
			await this.createStage(stage.slug)
		}
	}

	public async createStage(slug: string): Promise<void> {
		const stage = this.getStageInternal(slug)
		await this.stageCreator.createStage(this.db, stage.base ? this.getStage(stage.base) : null, stage)
		this.createdStages.add(slug)
	}

	public async migrate(migration: string | Migration): Promise<void> {
		if (typeof migration === 'string') {
			const version = MigrationVersionHelper.extractVersion(migration)
			const resolvedMigration = (await this.migrationResolver.getMigrations()).find(it => it.version === version)
			if (!resolvedMigration) {
				throw new Error(`Migration ${migration} not found`)
			}
			migration = resolvedMigration
		}
		await this.projectMigrator.migrate(this.db, [migration], () => null)
	}

	private getStageInternal(slug: string): StageConfig {
		const stage = this.stages.find(it => it.slug === slug)
		if (!stage) {
			throw new Error(`Unknown stage ${slug}`)
		}
		return stage
	}
}
