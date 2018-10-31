import Command from '../core/cli/Command'
import { readFile } from "fs"
import { promisify } from "util"
import { Config, parseConfig } from '../tenant-api/config'

const fsRead = promisify(readFile)

interface GlobalOptions {
	workingDirectory: string
	projectsDirectory: string
	configFile: string
}

abstract class BaseCommand<Args extends Command.Arguments, Options extends Command.Options> extends Command<Args, Options> {

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
			const file = await fsRead(options.configFile, { encoding: 'utf8' })
			this.config = parseConfig(file)
		}
		return this.config
	}
}

export default BaseCommand
