import { FieldName } from '../bindingTypes'
import { AccessorContextValue } from '../coreComponents'
import { PlaceholderGenerator } from '../model'
import { AccessorTreeRoot } from './AccessorTreeRoot'
import { EntityCollectionAccessor } from './EntityCollectionAccessor'
import { FieldAccessor } from './FieldAccessor'
import { MarkerTreeRoot } from './MarkerTreeRoot'
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
	export type FieldData = AccessorContextValue | EntityCollectionAccessor | FieldAccessor | AccessorTreeRoot

	export type EntityData = { [placeholder in FieldName]: FieldData }
}

export { EntityData }
