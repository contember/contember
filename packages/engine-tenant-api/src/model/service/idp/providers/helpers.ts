import * as Typesafe from '@contember/typesafe'

export const catchTypesafe = <T extends Typesafe.Json>(type: Typesafe.Type<T>, errorConstructor: { new(message: string): Error }) => (value: unknown): T => {
	try {
		return type(value)
	} catch (e) {
		if (e instanceof Typesafe.ParseError) {
			throw new errorConstructor(e.message)
		}
		throw e
	}
}
