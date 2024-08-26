import { Config, ConfigInput, ConfigureErrorCode } from '../../schema'
import { Response, ResponseOk } from '../utils/Response'
import { DatabaseContext } from '../utils'
import { UpdateConfigurationCommand } from '../commands'
import { ConfigurationQuery } from '../queries'

export class ConfigurationManager {
	constructor() {
	}

	public async updateConfiguration(db: DatabaseContext, configuration: ConfigInput): Promise<Response<null, ConfigureErrorCode>> {
		// todo: validate configuration

		await db.commandBus.execute(new UpdateConfigurationCommand(configuration))

		return new ResponseOk(null)
	}

	public async fetchConfiguration(db: DatabaseContext): Promise<Config> {
		return await db.queryHandler.fetch(new ConfigurationQuery())
	}
}
