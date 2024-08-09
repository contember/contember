import { assertNever } from '../../utils'
import type { StateNode } from '../state'
import type { MeaningfulMarker } from '@contember/binding-common'
import { MarkerSugarer } from './MarkerSugarer'
import { TreeParameterSugarer } from './TreeParameterSugarer'

export class ErrorLocator {
	private static readonly GLUE = '.'

	public static locateMarkerPath(path: MeaningfulMarker[]): string {
		return path.map(marker => MarkerSugarer.sugarMarker(marker)).join(this.GLUE)
	}

	public static locateInternalState(state: StateNode): string {
		function stateToPath(state: StateNode | undefined): string[] {
			if (state === undefined) {
				return []
			}
			switch (state.type) {
				case 'field':
					return [...stateToPath(state.parent), TreeParameterSugarer.sugarField(state.fieldMarker.fieldName)]
				case 'entityRealm': {
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
				case 'entityList': {
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
