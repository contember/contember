import { DataBindingError } from '../dao'
import { MarkerTreeRoot, ReferenceMarker } from '../markers'
import { PlaceholderGenerator } from '../markers/PlaceholderGenerator'
import { FieldName, SubTreeIdentifier } from '../treeParameters'
import { EntityAccessor } from './EntityAccessor'
import { EntityForRemovalAccessor } from './EntityForRemovalAccessor'
import { EntityListAccessor } from './EntityListAccessor'
import { FieldAccessor } from './FieldAccessor'
import { RootAccessor } from './RootAccessor'

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

	public getTreeRoot(subTreeIdentifier: SubTreeIdentifier): RootAccessor
	public getTreeRoot(id: MarkerTreeRoot.TreeId): RootAccessor
	public getTreeRoot(identifier: SubTreeIdentifier | MarkerTreeRoot.TreeId): RootAccessor {
		const root = this.data[PlaceholderGenerator.getMarkerTreePlaceholder(identifier)]
		if (root === undefined) {
			throw new DataBindingError(`Requesting an accessor tree '${identifier}' but it does not exist.`)
		} else if (root instanceof FieldAccessor) {
			throw new DataBindingError(`Requesting an accessor tree '${identifier}' but it resolves to a field.`)
		}
		return root
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
		| RootAccessor

	export type EntityData = { [placeholder in FieldName]: FieldData }
}

export { EntityData }
