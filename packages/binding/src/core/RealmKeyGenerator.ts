import { RuntimeId } from '../accessorTree'
import { EntityFieldMarkersContainer } from '../markers'
import { EntityId, EntityRealmKey, PlaceholderName } from '../treeParameters'
import { assertNever } from '../utils'
import { EntityListState, EntityRealmBlueprint, EntityRealmState } from './state'

const GLUE = '--'
const keyEndRegex = new RegExp(`${GLUE}\\d+$`)

export class RealmKeyGenerator {
	private static getParentStateId = (() => {
		// We're using this id, and not, well, the entity id, because it *SIGNIFICANTLY* reduces the complexity of
		// entity id changes.
		let seed = 0
		const rootSeed = seed++
		const seedCache: WeakMap<EntityRealmState | EntityListState, string> = new WeakMap()

		return (entity: EntityRealmState | EntityListState | undefined) => {
			if (entity === undefined) {
				return rootSeed
			}
			let existing = seedCache.get(entity)

			if (existing === undefined) {
				seedCache.set(entity, (existing = (seed++).toFixed(0)))
			}
			return existing
		}
	})()
	private static getMarkerId = (() => {
		let seed = 0
		const seedCache: WeakMap<EntityFieldMarkersContainer, string> = new WeakMap()

		return (container: EntityFieldMarkersContainer) => {
			let existing = seedCache.get(container)

			if (existing === undefined) {
				seedCache.set(container, (existing = (seed++).toFixed(0)))
			}
			return existing
		}
	})()

	public static vaguelyAppearsToBeAKey(candidate: string): boolean {
		// This is just for error messages. No need to be super precise.
		return candidate.startsWith(`key${GLUE}`) && keyEndRegex.test(candidate)
	}

	private static generateKey(
		parent: EntityRealmState | EntityListState | undefined,
		placeholderName: PlaceholderName,
		id: EntityId,
		container: EntityFieldMarkersContainer,
	): EntityRealmKey {
		// The static prefix serves to really emphasize that this is *NOT* just a uuid
		return `key${GLUE}${this.getParentStateId(parent)}${GLUE}${placeholderName}${id}${GLUE}${this.getMarkerId(
			container,
		)}`
	}

	public static getRealmKey(id: RuntimeId, blueprint: EntityRealmBlueprint): EntityRealmKey {
		const parent = blueprint.parent
		let placeholderName: PlaceholderName

		if (blueprint.type === 'subTree') {
			placeholderName = blueprint.marker.placeholderName
		} else if (blueprint.type === 'listEntity') {
			placeholderName = blueprint.parent.blueprint.marker.placeholderName
		} else if (blueprint.type === 'hasOne') {
			placeholderName = blueprint.marker.placeholderName
		} else {
			return assertNever(blueprint)
		}
		return this.generateKey(
			parent,
			placeholderName,
			id.value,
			blueprint.type === 'listEntity' ? blueprint.parent.blueprint.marker.fields : blueprint.marker.fields,
		)
	}
}
