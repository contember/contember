import { SelectBuilder } from '@contember/database'
import {
	DatabaseContext, formatSchemaName,
	MigrationsResolver,
	ProjectConfig,
	ProjectMigrator,
	StageConfig,
	StageCreator,
} from '@contember/engine-system-api'
import { Migration, MigrationVersionHelper } from '@contember/schema-migrations'
import { testUuid } from './testUuid'

export class TesterStageManager {
	private createdStages = new Set<string>()

	constructor(
		private readonly project: ProjectConfig,
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

	public async createAll(): Promise<void> {
		for (const stage of this.project.stages) {
			await this.createStage(stage.slug)
		}
	}

	public async createStage(slug: string): Promise<void> {
		const stage = this.getStageInternal(slug)
		await this.stageCreator.createStage(this.db, stage)
		this.createdStages.add(slug)
	}

	public async migrate(migration: string | Migration): Promise<void> {
		if (typeof migration === 'string') {
			const version = MigrationVersionHelper.extractVersion(migration)
			const migrations = await this.migrationResolver.getMigrations()
			const resolvedMigration = migrations.find(it => it.version === version)
			if (!resolvedMigration) {
				throw new Error(`Migration ${migration} not found`)
			}
			migration = resolvedMigration
		}
		await this.projectMigrator.migrate(this.db, this.project.stages.map(it => ({
			...it,
			id: testUuid(0),
			schema: formatSchemaName(it),
		})), [migration], { })
	}

	private getStageInternal(slug: string): StageConfig {
		const stage = this.project.stages.find(it => it.slug === slug)
		if (!stage) {
			throw new Error(`Unknown stage ${slug}`)
		}
		return stage
	}
}
