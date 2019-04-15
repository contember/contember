import CommandConfiguration from './CommandConfiguration'

abstract class Command<Args extends Command.Arguments, Options extends Command.Options> {
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

	protected abstract async execute(input: Command.Input): Promise<void | true>

	public async run(args: string[]): Promise<boolean> {
		const parser = this.getConfiguration().createParser()
		const input = parser.parse(args, false)
		const result = await this.execute(input)
		return result || false
	}
}

namespace Command {
	export type Arguments = { [name: string]: string | string[] | undefined }
	export type Options = { [name: string]: string | boolean | string[] | undefined }

	export class Input<Args extends Arguments = Arguments, Opts extends Options = Options> {
		constructor(private readonly args: Args, private readonly options: Opts, public readonly rest: string[]) {}

		getOption<Name extends keyof Opts>(name: Name): Opts[Name] {
			return this.options[name]
		}

		getArgument<Name extends keyof Args>(name: Name): Args[Name] {
			return this.args[name]
		}
	}
}

export default Command
