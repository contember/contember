import { RuntimeId } from '../accessorTree'
import { EntityFieldMarkersContainer } from '../markers'
import { EntityRealmKey } from '../treeParameters'
import {
	EntityListBlueprint,
	EntityRealmBlueprint,
	EntityRealmState,
	EntityRealmStateStub,
	getEntityMarker,
} from './state'

const GLUE = '--'
const keyEndRegex = new RegExp(`${GLUE}\\d+$`)

export class RealmKeyGenerator {
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

	private static generateKey(id: string, container: EntityFieldMarkersContainer) {
		// The static prefix serves to really emphasize that this is *NOT* just a uuid
		return `key${GLUE}${id}${GLUE}${this.getMarkerId(container)}`
	}

	public static getRealmStateKey(realm: EntityRealmState): EntityRealmKey {
		return this.generateKey(realm.entity.id.value, getEntityMarker(realm).fields)
	}

	public static getRealmStubKey(stub: EntityRealmStateStub): EntityRealmKey {
		return this.generateKey(stub.entity.id.value, getEntityMarker(stub).fields)
	}

	public static getListEntityRealmKey(id: RuntimeId | string, blueprint: EntityListBlueprint): EntityRealmKey {
		return this.generateKey(typeof id === 'string' ? id : id.value, blueprint.marker.fields)
	}

	public static getRealmKey(id: RuntimeId, blueprint: EntityRealmBlueprint): EntityRealmKey {
		return this.generateKey(
			id.value,
			blueprint.type === 'listEntity' ? blueprint.parent.blueprint.marker.fields : blueprint.marker.fields,
		)
	}
}
