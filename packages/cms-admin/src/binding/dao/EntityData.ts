import { FieldName } from '../bindingTypes'
import { AccessorTreeRoot } from './AccessorTreeRoot'
import { EntityAccessor } from './EntityAccessor'
import { EntityCollectionAccessor } from './EntityCollectionAccessor'
import { EntityForRemovalAccessor } from './EntityForRemovalAccessor'
import { FieldAccessor } from './FieldAccessor'
import { MarkerTreeRoot } from './MarkerTreeRoot'
import { PlaceholderGenerator } from './PlaceholderGenerator'
import { ReferenceMarker } from './ReferenceMarker'

class EntityData {
	public constructor(private data: EntityData.EntityData) {}

	public getField(fieldName: FieldName): EntityData.FieldData
	public getField(
		fieldName: FieldName,
		expectedCount: ReferenceMarker.ReferenceConstraints['expectedCount'],
		filter: ReferenceMarker.ReferenceConstraints['filter'],
	): EntityData.FieldData
	public getField(
		fieldName: FieldName,
		expectedCount: ReferenceMarker.ReferenceConstraints['expectedCount'],
		filter: ReferenceMarker.ReferenceConstraints['filter'],
		reducedBy: ReferenceMarker.ReferenceConstraints['reducedBy'],
	): EntityData.FieldData
	public getField(
		fieldName: FieldName,
		expectedCount?: ReferenceMarker.ReferenceConstraints['expectedCount'],
		filter?: ReferenceMarker.ReferenceConstraints['filter'],
		reducedBy?: ReferenceMarker.ReferenceConstraints['reducedBy'],
	): EntityData.FieldData {
		let placeholder: FieldName

		if (expectedCount !== undefined) {
			placeholder = PlaceholderGenerator.getReferencePlaceholder(fieldName, {
				expectedCount,
				reducedBy,
				filter,
			})
		} else {
			placeholder = PlaceholderGenerator.getFieldPlaceholder(fieldName)
		}

		return this.data[placeholder]
	}

	public getTreeRoot(associatedField: FieldName): EntityData.FieldData
	public getTreeRoot(id: MarkerTreeRoot.TreeId): EntityData.FieldData
	public getTreeRoot(identifier: FieldName | MarkerTreeRoot.TreeId): EntityData.FieldData {
		return this.data[PlaceholderGenerator.getMarkerTreePlaceholder(identifier)]
	}

	public get allFieldData(): EntityData.EntityData {
		return this.data
	}
}

namespace EntityData {
	export type FieldData =
		| undefined
		| EntityAccessor
		| EntityForRemovalAccessor
		| EntityCollectionAccessor
		| FieldAccessor
		| AccessorTreeRoot

	export type EntityData = { [placeholder in FieldName]: FieldData }
}

export { EntityData }
