import { SetProjectSecretCommand, UpdateProjectCommand } from '../commands'
import { Providers } from '../providers'
import { ProjectSecretsQuery } from '../queries'
import { DatabaseContext } from '../utils'

export class SecretsManager {
	constructor(private providers: Providers) {}

	public async setSecret(dbContext: DatabaseContext, projectId: string, key: string, value: string): Promise<void> {
		await dbContext.transaction(async db => {
			await db.commandBus.execute(new SetProjectSecretCommand(projectId, key, value))
			await db.commandBus.execute(new UpdateProjectCommand(projectId, {}))
		})
	}

	public async readSecrets(dbContext: DatabaseContext, projectId: string): Promise<Record<string, string>> {
		return await dbContext.queryHandler.fetch(new ProjectSecretsQuery(projectId, this.providers))
	}
}
