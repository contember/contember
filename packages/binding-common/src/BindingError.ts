export class BindingError extends Error {}

export const throwBindingError = (message: string): never => {
	throw new BindingError(message)
}
