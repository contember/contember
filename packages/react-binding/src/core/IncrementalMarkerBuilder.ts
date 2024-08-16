import {
	EntityFieldMarker,
	EntityFieldMarkersContainer,
	EntityFieldsWithHoistablesMarker,
	MarkerFactory,
	MarkerMerger,
	TreeParameterMerger,
} from '@contember/binding'

export class IncrementalMarkerBuilder {
	private accumulator: EntityFieldsWithHoistablesMarker | EntityFieldMarkersContainer = new EntityFieldMarkersContainer(
		false,
		new Map(),
		new Map(),
	)

	public mutateIn(addition: EntityFieldMarker | EntityFieldMarkersContainer | EntityFieldsWithHoistablesMarker) {
		if (addition instanceof EntityFieldMarkersContainer) {
			if (this.accumulator instanceof EntityFieldMarkersContainer) {
				this.accumulator = MarkerMerger.mergeEntityFieldsContainers(this.accumulator, addition)
			} else {
				this.accumulator = new EntityFieldsWithHoistablesMarker(
					MarkerMerger.mergeEntityFieldsContainers(this.accumulator.fields, addition),
					this.accumulator.subTrees,
					this.accumulator.parentReference,
				)
			}
		} else if (addition instanceof EntityFieldsWithHoistablesMarker) {
			if (this.accumulator instanceof EntityFieldMarkersContainer) {
				this.accumulator = new EntityFieldsWithHoistablesMarker(
					MarkerMerger.mergeEntityFieldsContainers(this.accumulator, addition.fields),
					addition.subTrees,
					addition.parentReference,
				)
			} else {
				this.accumulator = new EntityFieldsWithHoistablesMarker(
					MarkerMerger.mergeEntityFieldsContainers(this.accumulator.fields, addition.fields),
					MarkerMerger.mergeSubTreeMarkers(this.accumulator.subTrees, addition.subTrees),
					TreeParameterMerger.mergeParentEntityParameters(this.accumulator.parentReference, addition.parentReference),
				)
			}
		} else {
			if (this.accumulator instanceof EntityFieldMarkersContainer) {
				this.accumulator = MarkerMerger.mergeEntityFieldsContainers(
					this.accumulator,
					MarkerFactory.createEntityFieldMarkersContainer(addition),
				)
			} else {
				this.accumulator = new EntityFieldsWithHoistablesMarker(
					MarkerMerger.mergeEntityFieldsContainers(
						this.accumulator.fields,
						MarkerFactory.createEntityFieldMarkersContainer(addition),
					),
					this.accumulator.subTrees,
					this.accumulator.parentReference,
				)
			}
		}
	}

	public getFinalMarker() {
		return this.accumulator
	}
}
