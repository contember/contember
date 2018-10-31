type Option = {
	name: string
	description?: string
	shortcut?: string
	required: boolean
	mode: Option.Mode
}


namespace Option {
	export enum Mode {
		VALUE_NONE = 'value_none',
		VALUE_OPTIONAL = 'value_optional',
		VALUE_REQUIRED = 'value_required',
		VALUE_ARRAY = 'value_array',
	}


	export class Configuration {
		constructor(private readonly option: Option) {
		}

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
			this.option.mode = Mode.VALUE_REQUIRED
			return this
		}

		public valueNone() {
			this.option.mode = Mode.VALUE_NONE
			return this
		}

		public valueOptional() {
			this.option.mode = Mode.VALUE_OPTIONAL
			return this
		}

		public valueArray() {
			this.option.mode = Mode.VALUE_ARRAY
			return this
		}
	}
}

export default Option
