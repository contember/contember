import {
	EntityFieldMarker,
	EntityFieldMarkersContainer,
	EntityFieldsWithHoistablesMarker,
	MarkerFactory,
	MarkerMerger,
	TreeParameterMerger,
} from '@contember/binding'

export class IncrementalMarkerBuilder {
	public static build(markers: (EntityFieldMarker | EntityFieldMarkersContainer | EntityFieldsWithHoistablesMarker)[]): EntityFieldsWithHoistablesMarker | EntityFieldMarkersContainer {
		return markers.reduce<EntityFieldsWithHoistablesMarker | EntityFieldMarkersContainer>((acc, addition) => {
			if (addition instanceof EntityFieldMarkersContainer) {
				if (acc instanceof EntityFieldMarkersContainer) {
					return MarkerMerger.mergeEntityFieldsContainers(acc, addition)
				} else {
					return new EntityFieldsWithHoistablesMarker(
						MarkerMerger.mergeEntityFieldsContainers(acc.fields, addition),
						acc.subTrees,
						acc.parentReference,
					)
				}
			} else if (addition instanceof EntityFieldsWithHoistablesMarker) {
				if (acc instanceof EntityFieldMarkersContainer) {
					return new EntityFieldsWithHoistablesMarker(
						MarkerMerger.mergeEntityFieldsContainers(acc, addition.fields),
						addition.subTrees,
						addition.parentReference,
					)
				} else {
					return new EntityFieldsWithHoistablesMarker(
						MarkerMerger.mergeEntityFieldsContainers(acc.fields, addition.fields),
						MarkerMerger.mergeSubTreeMarkers(acc.subTrees, addition.subTrees),
						TreeParameterMerger.mergeParentEntityParameters(acc.parentReference, addition.parentReference),
					)
				}
			} else {
				if (acc instanceof EntityFieldMarkersContainer) {
					return MarkerMerger.mergeEntityFieldsContainers(
						acc,
						MarkerFactory.createEntityFieldMarkersContainer(addition),
					)
				} else {
					return new EntityFieldsWithHoistablesMarker(
						MarkerMerger.mergeEntityFieldsContainers(
							acc.fields,
							MarkerFactory.createEntityFieldMarkersContainer(addition),
						),
						acc.subTrees,
						acc.parentReference,
					)
				}
			}
		}, new EntityFieldMarkersContainer(
			false,
			new Map(),
			new Map(),
		))
	}
}
