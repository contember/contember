import type { RuntimeId } from '../accessorTree'
import type { EntityFieldMarkersContainer } from '../markers'
import type { EntityId, EntityRealmKey, PlaceholderName } from '../treeParameters'
import { assertNever } from '../utils'
import type { EntityListState, EntityRealmBlueprint, EntityRealmState } from './state'
import { WeakIdCache } from '../structures'

const GLUE = '--'
const keyEndRegex = new RegExp(`${GLUE}\\d+$`)

export class RealmKeyGenerator {
	// We're using this id, and not, well, the entity id, because it *SIGNIFICANTLY* reduces the complexity of
	// entity id changes.
	private static parentStateIdCache = new WeakIdCache<EntityRealmState | EntityListState>()
	private static markerIdCache = new WeakIdCache<EntityFieldMarkersContainer>()

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
		return `key${GLUE}${this.parentStateIdCache.getOptionalKeyId(
			parent,
		)}${GLUE}${placeholderName}${id}${GLUE}${this.markerIdCache.getId(container)}`
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
