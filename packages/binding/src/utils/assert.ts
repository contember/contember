import { BindingError } from '../BindingError'

export function assert(arg: boolean, message?: string): asserts arg {
	if (!arg) {
		throw new BindingError(`Assertion fail!${message ? `\n${message}` : ''}`)
	}
}
