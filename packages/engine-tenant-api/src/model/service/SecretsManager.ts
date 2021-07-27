import { SetProjectSecretCommand, UpdateProjectCommand } from '../commands'
import { Providers } from '../providers'
import { ListProjectSecretsQuery } from '../queries'
import { DatabaseContext } from '../utils'

export class SecretsManager {
	constructor(private dbContext: DatabaseContext, private providers: Providers) {}

	public async setSecret(projectId: string, key: string, value: string): Promise<void> {
		await this.dbContext.transaction(async db => {
			await db.commandBus.execute(new SetProjectSecretCommand(projectId, key, value))
			await db.commandBus.execute(new UpdateProjectCommand(projectId, {}))
		})
	}

	public async readSecrets(projectId: string): Promise<Record<string, string>> {
		return await this.dbContext.queryHandler.fetch(new ListProjectSecretsQuery(projectId, this.providers))
	}
}
