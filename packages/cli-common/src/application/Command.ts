import { CommandConfiguration } from './CommandConfiguration.js'
import { Arguments, Input, Options } from './Input.js'
import { globalOptions, GlobalOptionValues, readGlobalOptions } from './GlobalOptions.js'
import { Output } from './Output.js'

export interface ParsedCommandInput<Args extends Arguments, TOptions extends Options> {
	readonly input: Input<Args, TOptions>
	readonly globals: GlobalOptionValues
	readonly diagnostics: readonly string[]
}

export abstract class Command<Args extends Arguments, TOptions extends Options> {
	private configuration: CommandConfiguration<Args, TOptions> | undefined

	protected abstract configure(configuration: CommandConfiguration<Args, TOptions>): void

	public getConfiguration(): CommandConfiguration<Args, TOptions> {
		if (this.configuration === undefined) {
			const configuration = new CommandConfiguration()
			this.configure(configuration)
			configuration.validate(globalOptions)
			this.configuration = configuration
		}
		return this.configuration
	}

	protected abstract execute(input: Input<Args, TOptions>, output: Output): Promise<void | number>

	/** Parses argv in a single pass over the command options merged with the global ones. */
	public parse(args: string[]): ParsedCommandInput<Args, TOptions> {
		const parsed = this.getConfiguration().createParser(globalOptions).parse<Args, TOptions>(args)
		return { input: parsed.input, globals: readGlobalOptions(parsed.input), diagnostics: parsed.diagnostics }
	}

	public async runParsed(parsed: ParsedCommandInput<Args, TOptions>, output: Output): Promise<number> {
		for (const diagnostic of parsed.diagnostics) {
			output.warn(diagnostic)
		}
		const result = await this.execute(parsed.input, output)
		return result || 0
	}

	public async run(args: string[], output: Output = new Output()): Promise<number> {
		const parsed = this.parse(args)
		output.applyGlobalOptions(parsed.globals)
		return this.runParsed(parsed, output)
	}
}
