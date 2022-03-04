import { SetProjectSecretCommand, UpdateProjectCommand } from '../commands'
import { Providers } from '../providers'
import { ProjectSecretsQuery } from '../queries'
import { DatabaseContext } from '../utils'

export class SecretsManager {
	constructor(private providers: Providers) {}

	public async setSecret(dbContext: DatabaseContext, projectId: string, key: string, value: string): Promise<void> {
		await this.setSecrets(dbContext, projectId, [{ key, value: Buffer.from(value) }])
	}

	public async readSecrets(dbContext: DatabaseContext, projectId: string): Promise<Record<string, string>> {
		const result = await dbContext.queryHandler.fetch(new ProjectSecretsQuery(projectId, this.providers))
		const forUpdate = result.filter(it => it.needsReEncrypt)
		await this.setSecrets(dbContext, projectId, forUpdate)
		return Object.fromEntries(result.map(it => [it.key, it.value.toString()]))
	}

	private async setSecrets(dbContext: DatabaseContext, projectId: string, secrets: {key: string; value: Buffer}[]): Promise<void> {
		if (secrets.length === 0) {
			return
		}
		await dbContext.transaction(async db => {
			for (const { key, value } of secrets) {
				await db.commandBus.execute(new SetProjectSecretCommand(projectId, key, Buffer.from(value)))
			}
			await db.commandBus.execute(new UpdateProjectCommand(projectId, {}))
		})
	}
}
