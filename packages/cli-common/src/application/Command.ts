import { CommandConfiguration } from './CommandConfiguration.js'
import { Arguments, Input, Options } from './Input.js'

export abstract class Command<Args extends Arguments, TOptions extends Options> {
	private configuration: CommandConfiguration<Args, TOptions> | undefined

	protected abstract configure(configuration: CommandConfiguration<Args, TOptions>): void

	public getConfiguration(): CommandConfiguration<Args, TOptions> {
		if (this.configuration === undefined) {
			const configuration = new CommandConfiguration()
			this.configure(configuration)
			configuration.validate()
			this.configuration = configuration
		}
		return this.configuration
	}

	protected abstract execute(input: Input<Args, TOptions>): Promise<void | number>

	public async run(args: string[]): Promise<number> {
		const parser = this.getConfiguration().createParser()
		const input = parser.parse<Args, TOptions>(args)
		const result = await this.execute(input)
		return result || 0
	}
}
