import { Argument } from './Argument'
import { Option, OptionMode } from './Option'
import { assertNever } from './assertNever'

export type UsageFormat = 'line' | 'short' | 'multiline'
export class UsageFormatter {
	public static format(args: Argument[], options: Option[], format: UsageFormat): string {
		let parts = []
		const isShort = format === 'short'
		for (let arg of args) {
			const name = arg.name
			const argDescription = !isShort && arg.description ? ` (${arg.description})` : ''
			if (arg.variadic) {
				parts.push(`[...${name}${argDescription}]`)
			} else if (arg.optional) {
				parts.push(`[${name}${argDescription}]`)
			} else {
				parts.push(`<${name}${argDescription}>`)
			}
		}
		for (let opt of options) {
			if (opt.deprecated) {
				continue
			}
			const name = `--${opt.name}` + (!isShort && opt.shortcut ? `|-${opt.shortcut}` : '')
			let valueDescription
			switch (opt.mode) {
				case OptionMode.VALUE_ARRAY:
				case OptionMode.VALUE_REQUIRED:
					valueDescription = ' <value>'
					break
				case OptionMode.VALUE_OPTIONAL:
					valueDescription = ' [value]'
					break
				case OptionMode.VALUE_NONE:
					valueDescription = ''
					break
				default:
					assertNever(opt.mode)
			}
			let optionDescription = `${name}${valueDescription}`
			if (opt.mode === OptionMode.VALUE_ARRAY) {
				optionDescription = `${optionDescription} [... ${optionDescription}]`
			}
			if (!isShort && opt.description) {
				optionDescription += ` (${opt.description})`
			}
			if (!opt.required) {
				optionDescription = `[${optionDescription}]`
			}
			parts.push(optionDescription)
		}
		if (format === 'multiline') {
			return parts.map(it => `\t${it}`).join('\n')
		}
		return parts.join(' ')
	}
}
