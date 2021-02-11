import { StateNode, StateType } from '../state'
import { MarkerSugarer } from './MarkerSugarer'
import { RawMarkerPath } from './RawMarkerPath'

export class ErrorLocator {
	private static readonly GLUE = '.'

	public static locateMarkerPath(path: RawMarkerPath): string {
		return path.map(marker => MarkerSugarer.sugarMarker(marker)).join(this.GLUE)
	}

	public static locateInternalState(state: StateNode): string {
		function stateToPath(state: StateNode | undefined): RawMarkerPath {
			if (state === undefined) {
				return []
			}
			switch (state.type) {
				case StateType.Field:
					return [state.fieldMarker]
				case StateType.EntityRealm:
				case StateType.EntityList:
					return [] // TODO
			}
		}
		return '' // TODO
	}
}
