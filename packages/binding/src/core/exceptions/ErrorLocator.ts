import { assertNever } from '../../utils'
import { StateNode, StateType } from '../state'
import { MarkerSugarer } from './MarkerSugarer'
import type { RawMarkerPath } from './RawMarkerPath'
import { TreeParameterSugarer } from './TreeParameterSugarer'

export class ErrorLocator {
	private static readonly GLUE = '.'

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
					const blueprint = state.blueprint
					if (blueprint.type === 'subTree') {
						return [
							TreeParameterSugarer.sugarRootEntity(
								state.entity.entityName,
								blueprint.marker.parameters.isCreating ? undefined : blueprint.marker.parameters.where,
							),
						]
					}
					if (blueprint.type === 'listEntity') {
						return [...stateToPath(blueprint.parent)]
					}
					if (blueprint.type === 'hasOne') {
						return [...stateToPath(blueprint.parent), MarkerSugarer.sugarHasOneRelationMarker(blueprint.marker)]
					}
					return assertNever(blueprint)
				}
				case StateType.EntityList: {
					const blueprint = state.blueprint

					if (blueprint.parent === undefined) {
						return [
							TreeParameterSugarer.sugarRootEntityList(
								state.entityName,
								blueprint.marker.parameters.isCreating ? undefined : blueprint.marker.parameters.filter,
							),
						]
					}
					const hasMany = blueprint.marker
					return [...stateToPath(blueprint.parent), MarkerSugarer.sugarHasManyRelationMarker(hasMany)]
				}
			}
		}
		return stateToPath(state).join(this.GLUE)
	}
}
