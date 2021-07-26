import { CommandBus, SetProjectSecretCommand } from '../commands'
import { QueryHandler } from '@contember/queryable'
import { DatabaseQueryable } from '@contember/database'
import { Providers } from '../providers'
import { ListProjectSecretsQuery } from '../queries'

export class SecretsManager {
	constructor(
		private commandBus: CommandBus,
		private queryHandler: QueryHandler<DatabaseQueryable>,
		private providers: Providers,
	) {}

	public async setSecret(projectId: string, key: string, value: string): Promise<void> {
		await this.commandBus.execute(new SetProjectSecretCommand(projectId, key, value))
	}

	public async readSecrets(projectId: string): Promise<Record<string, string>> {
		return await this.queryHandler.fetch(new ListProjectSecretsQuery(projectId, this.providers))
	}
}
