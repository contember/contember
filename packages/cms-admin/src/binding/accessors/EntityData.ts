import { MarkerTreeRoot, ReferenceMarker } from '../markers'
import { PlaceholderGenerator } from '../markers/PlaceholderGenerator'
import { FieldName, SubTreeIdentifier } from '../treeParameters'
import { AccessorTreeRoot } from './AccessorTreeRoot'
import { EntityAccessor } from './EntityAccessor'
import { EntityForRemovalAccessor } from './EntityForRemovalAccessor'
import { EntityListAccessor } from './EntityListAccessor'
import { FieldAccessor } from './FieldAccessor'

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

	public getTreeRoot(subTreeIdentifier: SubTreeIdentifier): EntityData.FieldData
	public getTreeRoot(id: MarkerTreeRoot.TreeId): EntityData.FieldData
	public getTreeRoot(identifier: SubTreeIdentifier | MarkerTreeRoot.TreeId): EntityData.FieldData {
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
		| EntityListAccessor
		| FieldAccessor
		| AccessorTreeRoot

	export type EntityData = { [placeholder in FieldName]: FieldData }
}

export { EntityData }
