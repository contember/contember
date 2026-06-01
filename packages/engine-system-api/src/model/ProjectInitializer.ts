import { ProjectConfig } from '../types.js'
import { StageCreator } from './stages/index.js'
import { DatabaseContext } from './database/index.js'
import { Connection, retryTransaction } from '@contember/database'
import { FingerCrossedLoggerHandler, Logger } from '@contember/logger'
import { SystemMigrationsRunner } from '../migrations/index.js'

export class ProjectInitializer {
	constructor(
		private readonly stageCreator: StageCreator,
		private readonly migrationsRunner: SystemMigrationsRunner,
		private readonly databaseContext: DatabaseContext,
		private readonly project: ProjectConfig,
	) {}

	public async initialize(logger: Logger) {
		return await logger.scope(
			async initLogger => {
				initLogger.debug('Executing system schema migrations')
				await this.migrationsRunner.run(initLogger)
				const dbContext = this.databaseContext
				await retryTransaction(
					() =>
						dbContext.transaction(async trx => {
							await this.initStages(trx, logger)
						}),
					message => initLogger.warn(message),
				)
				if (dbContext.client.connection instanceof Connection) {
					await dbContext.client.connection.clearPool()
				}
			},
			{},
			{ handler: FingerCrossedLoggerHandler.factory() },
		)
	}

	private async initStages(db: DatabaseContext<Connection.TransactionLike>, logger: Logger) {
		logger.debug(`Creating stages`)
		for (const stage of this.project.stages) {
			const created = await this.stageCreator.createStage(db, stage)
			if (created) {
				logger.warn(`Created stage ${stage.slug}`, { stage: stage.slug })
			} else {
				logger.debug(`Updated stage ${stage.slug}`, { stage: stage.slug })
			}
		}
	}
}
