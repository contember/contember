import Command from '../core/cli/Command'
import { Config, readConfig } from '../tenant-api/config'

interface GlobalOptions {
	workingDirectory: string
	projectsDirectory: string
	configFile: string
}

abstract class BaseCommand<Args extends Command.Arguments, Options extends Command.Options> extends Command<
	Args,
	Options
> {
	private config: Config | undefined

	private globalOptions: GlobalOptions | undefined

	public setGlobalOptions(options: GlobalOptions): void {
		this.globalOptions = options
	}

	public getGlobalOptions(): GlobalOptions {
		if (!this.globalOptions) {
			throw new Error()
		}
		return this.globalOptions
	}

	async readConfig(): Promise<Config> {
		const options = this.getGlobalOptions()
		if (this.config === undefined) {
			this.config = await readConfig(options.configFile)
		}
		return this.config
	}
}

export default BaseCommand
