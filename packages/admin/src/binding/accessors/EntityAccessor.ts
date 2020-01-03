import { DataBindingError } from '../dao'
import { MarkerTreeRoot, ReferenceMarker } from '../markers'
import { PlaceholderGenerator } from '../markers/PlaceholderGenerator'
import { FieldName, RemovalType, SubTreeIdentifier } from '../treeParameters'
import { Accessor } from './Accessor'
import { EntityForRemovalAccessor } from './EntityForRemovalAccessor'
import { EntityListAccessor } from './EntityListAccessor'
import { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'
import { FieldAccessor } from './FieldAccessor'
import { RootAccessor } from './RootAccessor'

class EntityAccessor extends Accessor implements Errorable {
	public readonly primaryKey: string | EntityAccessor.UnpersistedEntityID

	public constructor(
		primaryKey: string | EntityAccessor.UnpersistedEntityID | undefined,
		public readonly typename: string | undefined,
		public readonly data: EntityAccessor.EntityData,
		public readonly errors: ErrorAccessor[],
		public readonly replaceWith?: (replacement: EntityAccessor) => void,
		public readonly batchUpdates?: (performUpdates: (getAccessor: () => EntityAccessor) => void) => void,
		public readonly remove?: (removalType: RemovalType) => void,
	) {
		super()
		this.primaryKey = primaryKey || new EntityAccessor.UnpersistedEntityID()
	}

	public isPersisted(): boolean {
		return typeof this.primaryKey === 'string'
	}

	public getKey() {
		return this.primaryKey instanceof EntityAccessor.UnpersistedEntityID ? this.primaryKey.value : this.primaryKey
	}

	public getPersistedKey() {
		return this.primaryKey instanceof EntityAccessor.UnpersistedEntityID ? undefined : this.primaryKey
	}

	public getField(fieldName: FieldName): EntityAccessor.FieldData
	public getField(
		fieldName: FieldName,
		expectedCount: ReferenceMarker.ReferenceConstraints['expectedCount'],
		filter: ReferenceMarker.ReferenceConstraints['filter'],
	): EntityAccessor.FieldData
	public getField(
		fieldName: FieldName,
		expectedCount: ReferenceMarker.ReferenceConstraints['expectedCount'],
		filter: ReferenceMarker.ReferenceConstraints['filter'],
		reducedBy: ReferenceMarker.ReferenceConstraints['reducedBy'],
	): EntityAccessor.FieldData
	public getField(
		fieldName: FieldName,
		expectedCount?: ReferenceMarker.ReferenceConstraints['expectedCount'],
		filter?: ReferenceMarker.ReferenceConstraints['filter'],
		reducedBy?: ReferenceMarker.ReferenceConstraints['reducedBy'],
	): EntityAccessor.FieldData {
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

	public get allFieldData(): EntityAccessor.EntityData {
		return this.data
	}
}

namespace EntityAccessor {
	export class UnpersistedEntityID {
		public readonly value: string

		private static generateId = (() => {
			let id = 0
			return () => id++
		})()

		public constructor() {
			this.value = `unpersistedEntity-${UnpersistedEntityID.generateId()}`
		}
	}

	export type FieldData =
		| undefined
		| EntityAccessor
		| EntityForRemovalAccessor
		| EntityListAccessor
		| FieldAccessor
		| RootAccessor

	export type EntityData = { [placeholder in FieldName]: FieldData }
}

export { EntityAccessor }
