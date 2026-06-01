import { ConfigInput, ConfigureErrorCode } from '../../schema/index.js'
import { Response, ResponseOk } from '../utils/Response.js'
import { DatabaseContext } from '../utils/index.js'
import { UpdateConfigurationCommand } from '../commands/index.js'

export class ConfigurationManager {
	public async updateConfiguration(db: DatabaseContext, configuration: ConfigInput): Promise<Response<null, ConfigureErrorCode>> {
		// todo: validate configuration

		await db.commandBus.execute(new UpdateConfigurationCommand(configuration))

		return new ResponseOk(null)
	}
}
