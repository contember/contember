import { FieldName } from '../bindingTypes'
import { DataContextValue } from '../coreComponents/DataContext'
import PlaceholderGenerator from '../model/PlaceholderGenerator'
import EntityCollectionAccessor from './EntityCollectionAccessor'
import MarkerTreeRoot from './MarkerTreeRoot'
import ReferenceMarker from './ReferenceMarker'

class EntityData {
	public constructor(private data: EntityData.EntityData) {}

	public getField(fieldName: FieldName): EntityData.FieldData
	public getField(
		fieldName: FieldName,
		expectedCount: ReferenceMarker.ReferenceConstraints['expectedCount'],
		where: ReferenceMarker.ReferenceConstraints['where']
	): EntityData.FieldData
	public getField(
		fieldName: FieldName,
		expectedCount: ReferenceMarker.ReferenceConstraints['expectedCount'],
		where: ReferenceMarker.ReferenceConstraints['where'],
		reducedBy: ReferenceMarker.ReferenceConstraints['reducedBy']
	): EntityData.FieldData
	public getField(
		fieldName: FieldName,
		expectedCount?: ReferenceMarker.ReferenceConstraints['expectedCount'],
		where?: ReferenceMarker.ReferenceConstraints['where'],
		reducedBy?: ReferenceMarker.ReferenceConstraints['reducedBy']
	): EntityData.FieldData {
		let placeholder: FieldName

		if (expectedCount !== undefined) {
			placeholder = PlaceholderGenerator.getReferencePlaceholder(fieldName, {
				expectedCount,
				reducedBy,
				where
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
	export type FieldData = DataContextValue | EntityCollectionAccessor

	export type EntityData = { [placeholder in FieldName]: FieldData }
}

export default EntityData
