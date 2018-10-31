import Argument from './Argument'
import Option from './Option'
import { assertNever } from 'cms-common'

class UsageFormatter {
	public static format(args: Argument[], options: Option[]): string {
		let parts = []
		for (let arg of args) {
			const name = arg.name + (arg.description ? ` ${arg.description}` : '')
			if (arg.variadic) {
				parts.push(`[...${name}]`)
			} else if (arg.optional) {
				parts.push(`[${name}]`)
			} else {
				parts.push(`<${name}>`)
			}
		}
		for (let opt of options) {
			const name = `--${opt.name}` + (opt.shortcut ? `|-${opt.shortcut}` : '')
			let valueDescription
			switch (opt.mode) {
				case Option.Mode.VALUE_ARRAY:
				case Option.Mode.VALUE_REQUIRED:
					valueDescription = ' <value>'
					break
				case Option.Mode.VALUE_OPTIONAL:
					valueDescription = ' [value]'
					break
				case Option.Mode.VALUE_NONE:
					valueDescription = ''
					break
				default:
					assertNever(opt.mode)
			}
			let optionDescription = `${name}${valueDescription}`
			if (opt.mode === Option.Mode.VALUE_ARRAY) {
				optionDescription = `${optionDescription} [... ${optionDescription}]`
			}
			if (!opt.required) {
				optionDescription = `[${optionDescription}]`
			}
			parts.push(optionDescription)
		}

		return parts.join(' ')
	}
}

export default UsageFormatter
