export type Option = {
	name: string
	description?: string
	shortcut?: string
	required: boolean
	deprecated: boolean
	mode: OptionMode
}

export enum OptionMode {
	VALUE_NONE = 'value_none',
	VALUE_OPTIONAL = 'value_optional',
	VALUE_REQUIRED = 'value_required',
	VALUE_ARRAY = 'value_array',
}

export class OptionConfiguration {
	constructor(private readonly option: Option) {}

	public shortcut(shortcut: string) {
		this.option.shortcut = shortcut
		return this
	}

	public description(description: string) {
		this.option.description = description
		return this
	}

	public required(required: boolean = true) {
		this.option.required = required
		return this
	}

	public valueRequired() {
		this.option.mode = OptionMode.VALUE_REQUIRED
		return this
	}

	public valueNone() {
		this.option.mode = OptionMode.VALUE_NONE
		return this
	}

	public valueOptional() {
		this.option.mode = OptionMode.VALUE_OPTIONAL
		return this
	}

	public valueArray() {
		this.option.mode = OptionMode.VALUE_ARRAY
		return this
	}

	public deprecated() {
		this.option.deprecated = true
		return this
	}
}
