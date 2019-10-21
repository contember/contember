import CommandConfiguration from './CommandConfiguration'
import { Arguments, Input, Options } from './Input'

abstract class Command<Args extends Arguments, TOptions extends Options> {
	private configuration: CommandConfiguration | undefined

	protected abstract configure(configuration: CommandConfiguration): void

	public getConfiguration(): CommandConfiguration {
		if (this.configuration === undefined) {
			const configuration = new CommandConfiguration()
			this.configure(configuration)
			configuration.validate()
			this.configuration = configuration
		}
		return this.configuration
	}

	protected abstract async execute(input: Input<Args, TOptions>): Promise<void | true>

	public async run(args: string[]): Promise<boolean> {
		const parser = this.getConfiguration().createParser()
		const input = parser.parse<Args, TOptions>(args, false)
		const result = await this.execute(input)
		return result || false
	}
}

export default Command
