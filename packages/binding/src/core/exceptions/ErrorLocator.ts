import { HasManyRelationMarker, HasOneRelationMarker } from '../../markers'
import { assertNever } from '../../utils'
import { StateNode, StateType } from '../state'
import { MarkerSugarer } from './MarkerSugarer'
import { RawMarkerPath } from './RawMarkerPath'
import { TreeParameterSugarer } from './TreeParameterSugarer'

export class ErrorLocator {
	// Prefixed by a zero-width space so that the path doesn't overflow if it's too long.
	private static readonly GLUE = '\u200B.'

	public static locateMarkerPath(path: RawMarkerPath): string {
		return path.map(marker => MarkerSugarer.sugarMarker(marker)).join(this.GLUE)
	}

	public static locateInternalState(state: StateNode): string {
		function stateToPath(state: StateNode | undefined): string[] {
			if (state === undefined) {
				return []
			}
			switch (state.type) {
				case StateType.Field:
					return [...stateToPath(state.parent), TreeParameterSugarer.sugarField(state.fieldMarker.fieldName)]
				case StateType.EntityRealm: {
					const parent = state.blueprint.parent
					if (parent === undefined) {
						// TODO get the where
						return [TreeParameterSugarer.sugarRootEntity(state.entity.entityName, undefined)]
					}
					if (parent.type === StateType.EntityList) {
						return [...stateToPath(parent)]
					}
					if (parent.type === StateType.EntityRealm) {
						const hasOne = parent.blueprint.markersContainer.markers.get(
							state.blueprint.placeholderName,
						) as HasOneRelationMarker
						return [...stateToPath(parent), MarkerSugarer.sugarHasOneRelationMarker(hasOne)]
					}
					return assertNever(parent)
				}
				case StateType.EntityList: {
					const parent = state.blueprint.parent
					if (parent === undefined) {
						// TODO get the filter
						return [TreeParameterSugarer.sugarRootEntityList(state.entityName, undefined)]
					}
					const hasMany = parent.blueprint.markersContainer.markers.get(
						state.blueprint.placeholderName,
					) as HasManyRelationMarker
					return [...stateToPath(parent), MarkerSugarer.sugarHasManyRelationMarker(hasMany)]
				}
			}
		}
		return stateToPath(state).join(this.GLUE)
	}
}
