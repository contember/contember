import { Argument, ArgumentConfiguration } from './Argument.js'
import { Option, OptionConfiguration, OptionMode } from './Option.js'
import { InputParser } from './InputParser.js'
import { UsageFormat, UsageFormatter } from './UsageFormatter.js'
import { Arguments, Options } from './Input.js'

export class CommandConfiguration<Args extends Arguments, TOptions extends Options> {
	private descriptionValue: string = ''

	private arguments: Argument[] = []
	private options: Option[] = []

	public description(description: string) {
		this.descriptionValue = description
	}

	public argument(name: Extract<keyof Args, string>): ArgumentConfiguration {
		const options = { name, optional: false, variadic: false }
		this.arguments.push(options)
		return new ArgumentConfiguration(options)
	}

	public option(name: Extract<keyof TOptions, string>): OptionConfiguration {
		const option: Option = { name, required: false, mode: OptionMode.VALUE_NONE, deprecated: false }
		this.options.push(option)
		return new OptionConfiguration(option)
	}

	public validate() {
		let hasVariadic = false
		let hasOptional = false
		for (let argument of this.arguments) {
			if (hasOptional && !argument.optional) {
				throw new InvalidConfigurationError(`Required argument ${argument.name} cannot follow an optional `)
			}
			if (hasVariadic) {
				throw new InvalidConfigurationError(`A variadic argument must be the last`)
			}
		}
	}

	public getDescription(): string {
		return this.descriptionValue
	}

	public createParser(): InputParser {
		return new InputParser(this.arguments, this.options)
	}

	public getUsage(args: { format?: UsageFormat; indent?: string } = {}): string {
		return UsageFormatter.format(this.arguments, this.options, args)
	}
}

export class InvalidConfigurationError extends Error {}
