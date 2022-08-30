import { EntityConstructor } from './decorators'

export const filterEntityDefinition = (definitions: Record<string, unknown>): [string, EntityConstructor][] => Object.entries(definitions)
	.filter((it): it is [string, EntityConstructor] => isEntityConstructor(it[1]))

export const isEntityConstructor = (it: unknown): it is EntityConstructor => {
	return typeof it === 'function' && 'constructor' in it && 'prototype' in it
}
