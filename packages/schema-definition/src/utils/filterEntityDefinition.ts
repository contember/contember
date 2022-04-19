import { EntityConstructor } from '../model/definition/types'

export const filterEntityDefinition = (definitions: Record<string, any>): [string, EntityConstructor][] => Object.entries(definitions)
	.filter(it => isEntityConstructor(it[1]))

export const isEntityConstructor = (it: any): it is EntityConstructor => {
	return it !== null && 'constructor' in it && 'prototype' in it && typeof it === 'function'
}
