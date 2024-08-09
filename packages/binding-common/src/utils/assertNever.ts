import { BindingError } from '../BindingError'

export function assertNever(_: never): never {
	throw new BindingError(
		`FATAL ERROR. This should absolutely never have happened. Please report this bug.`,
	)
}
