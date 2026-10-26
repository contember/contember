import type { Schema, Type } from '../types/schema.js'

const typeNamesCache = new WeakMap<Schema['t'], Map<Type, string>>()

/**
 * Name of a type definition by reference, via a reverse index built once per `schema.t` object.
 * The first name wins when the same definition is registered under several names.
 */
export function findTypeName(schema: Pick<Schema, 't'>, type: Type): string | undefined {
	let names = typeNamesCache.get(schema.t)
	if (!names) {
		names = new Map()
		for (const [name, t] of Object.entries(schema.t)) {
			if (!names.has(t)) {
				names.set(t, name)
			}
		}
		typeNamesCache.set(schema.t, names)
	}
	return names.get(type)
}
