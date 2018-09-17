import EntityMarker from './EntityMarker'
import { TreeId } from './TreeId'

export default class MarkerTreeRoot {
	private constructor(public readonly id: TreeId, public readonly root: EntityMarker) {}

	private static getNewTreeId: () => TreeId = (() => {
		let id = 0

		return () => (id++).toFixed(0)
	})()

	public static createInstance(rootMarker: EntityMarker): MarkerTreeRoot {
		return new MarkerTreeRoot(MarkerTreeRoot.getNewTreeId(), rootMarker)
	}
}
