export type Argument = {
	name: string
	description?: string
	optional: boolean
	variadic: boolean
	validator?: (value: string) => boolean
}

export class ArgumentConfiguration {
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
