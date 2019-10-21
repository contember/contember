type Argument = {
	name: string
	description?: string
	optional: boolean
	variadic: boolean
	validator?: (value: string) => boolean
}

namespace Argument {
	export class Configuration {
		constructor(private readonly options: Argument) {}

		public optional(optional: boolean = true) {
			this.options.optional = optional
			return this
		}

		public variadic(variadic: boolean = true) {
			this.options.variadic = variadic
			return this
		}

		public description(description: string) {
			this.options.description = description
			return this
		}

		public validator(validator: (value: string) => boolean) {
			this.options.validator = validator
			return this
		}
	}
}

export default Argument
