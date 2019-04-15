import Argument from './Argument'
import Option from './Option'
import InputParser from './InputParser'
import UsageFormatter from './UsageFormatter'

class CommandConfiguration {
	private descriptionValue: string = ''

	private arguments: Argument[] = []
	private options: Option[] = []

	public description(description: string) {
		this.descriptionValue = description
	}

	public argument(name: string): Argument.Configuration {
		const options = { name, optional: false, variadic: false }
		this.arguments.push(options)
		return new Argument.Configuration(options)
	}

	public option(name: string): Option.Configuration {
		const options: Option = { name, required: false, mode: Option.Mode.VALUE_NONE }

		return new Option.Configuration(options)
	}

	public validate() {
		let hasVariadic = false
		let hasOptional = false
		for (let argument of this.arguments) {
			if (hasOptional && !argument.optional) {
				throw new CommandConfiguration.InvalidConfigurationError(
					`Required argument ${argument.name} cannot follow an optional `
				)
			}
			if (hasVariadic) {
				throw new CommandConfiguration.InvalidConfigurationError(`A variadic argument must be the last`)
			}
		}
	}

	public getDescription(): string {
		return this.descriptionValue
	}

	public createParser(): InputParser {
		return new InputParser(this.arguments, this.options)
	}

	public getUsage(): string {
		return UsageFormatter.format(this.arguments, this.options)
	}
}

namespace CommandConfiguration {
	export class InvalidConfigurationError extends Error {}
}

export default CommandConfiguration
