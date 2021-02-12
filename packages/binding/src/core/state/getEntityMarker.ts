import { EntityRealmState, EntityRealmStateStub } from './EntityRealmState'

export const getEntityMarker = (realm: EntityRealmState | EntityRealmStateStub) =>
	realm.blueprint.type === 'listEntity' ? realm.blueprint.parent.blueprint.marker : realm.blueprint.marker
