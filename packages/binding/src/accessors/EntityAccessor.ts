import { BindingError } from '../BindingError'
import { MarkerTreeRoot, PlaceholderGenerator, ReferenceMarker } from '../markers'
import {
	DesugaredRelativeEntityList,
	DesugaredRelativeSingleEntity,
	DesugaredRelativeSingleField,
	ExpectedEntityCount,
	FieldName,
	FieldValue,
	RelativeEntityList,
	RelativeSingleEntity,
	RelativeSingleField,
	RemovalType,
	SubTreeIdentifier,
} from '../treeParameters'
import { Accessor } from './Accessor'
import { EntityForRemovalAccessor } from './EntityForRemovalAccessor'
import { EntityListAccessor } from './EntityListAccessor'
import { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'
import { FieldAccessor } from './FieldAccessor'
import { RootAccessor } from './RootAccessor'

class EntityAccessor extends Accessor implements Errorable {
	public readonly runtimeId: string | EntityAccessor.UnpersistedEntityId

	public constructor(
		key: string | EntityAccessor.UnpersistedEntityId,
		public readonly typename: string | undefined,
		public readonly data: EntityAccessor.EntityData,
		public readonly errors: ErrorAccessor[],
		public readonly addEventListener: EntityAccessor.AddEntityEventListener,
		public readonly batchUpdates: (performUpdates: EntityAccessor.BatchUpdates) => void,
		public readonly replaceBy: ((replacement: EntityAccessor) => void) | undefined,
		public readonly remove: ((removalType: RemovalType) => void) | undefined,
	) {
		super()
		this.runtimeId = key || new EntityAccessor.UnpersistedEntityId()
	}

	public get primaryKey(): string | undefined {
		return typeof this.runtimeId === 'string' ? this.runtimeId : undefined
	}

	public get isPersisted(): boolean {
		return typeof this.runtimeId === 'string'
	}

	public get key(): string {
		return typeof this.runtimeId === 'string' ? this.runtimeId : this.runtimeId.value
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
			throw new BindingError(`Requesting an accessor tree '${identifier}' but it does not exist.`)
		} else if (root instanceof FieldAccessor) {
			throw new BindingError(`Requesting an accessor tree '${identifier}' but it resolves to a field.`)
		}
		return root
	}

	/**
	 * If entity is a string, it *MUST NOT* make use of QL
	 */
	public getRelativeSingleEntity(
		entity: RelativeSingleEntity | DesugaredRelativeSingleEntity | string,
	): EntityAccessor {
		let relativeTo: EntityAccessor = this
		const hasOneRelationPath: DesugaredRelativeSingleEntity['hasOneRelationPath'] =
			typeof entity === 'string'
				? [
						{
							field: entity,
							reducedBy: undefined,
							filter: undefined,
						},
				  ]
				: entity.hasOneRelationPath
		for (const hasOneRelation of hasOneRelationPath) {
			const field = relativeTo.getField(
				hasOneRelation.field,
				ExpectedEntityCount.UpToOne,
				hasOneRelation.filter,
				hasOneRelation.reducedBy,
			)

			if (field instanceof EntityAccessor) {
				relativeTo = field
			} else {
				throw new BindingError('Corrupted data')
			}
		}
		return relativeTo
	}

	/**
	 * If field is a string, it *MUST NOT* make use of QL
	 */
	public getRelativeSingleField<Persisted extends FieldValue = FieldValue, Produced extends Persisted = Persisted>(
		field: RelativeSingleField | DesugaredRelativeSingleField | string,
	): FieldAccessor<Persisted, Produced> {
		let nestedEntity: EntityAccessor
		let fieldName: string

		if (typeof field === 'string') {
			nestedEntity = this
			fieldName = field
		} else {
			nestedEntity = this.getRelativeSingleEntity({ hasOneRelationPath: field.hasOneRelationPath })
			fieldName = field.field
		}

		const accessor = nestedEntity.getField(fieldName)

		if (!(accessor instanceof FieldAccessor)) {
			throw new BindingError(
				`Trying to access the field '${field}'${
					nestedEntity.typename ? ` of the '${nestedEntity.typename}' entity` : ''
				} but it does not exist.`,
			)
		}
		return (accessor as unknown) as FieldAccessor<Persisted, Produced>
	}

	/**
	 * If entityList is a string, it *MUST NOT* make use of QL
	 */
	public getRelativeEntityList(
		entityList: RelativeEntityList | DesugaredRelativeEntityList | string,
	): EntityListAccessor {
		let nestedEntity: EntityAccessor
		let fieldName: string

		if (typeof entityList === 'string') {
			nestedEntity = this
			fieldName = entityList
		} else {
			nestedEntity = this.getRelativeSingleEntity({ hasOneRelationPath: entityList.hasOneRelationPath })
			fieldName = entityList.hasManyRelation.field
		}

		const field = nestedEntity.getField(fieldName)

		if (!(field instanceof EntityListAccessor)) {
			throw new BindingError(
				`Trying to access the entity list '${field}'${
					nestedEntity.typename ? ` of the '${nestedEntity.typename}' entity` : ''
				} but it does not exist.`,
			)
		}
		return field
	}

	public get allFieldData(): EntityAccessor.EntityData {
		return this.data
	}
}

namespace EntityAccessor {
	export class UnpersistedEntityId {
		public readonly value: string

		private static generateId = (() => {
			let id = 0
			return () => id++
		})()

		public constructor() {
			this.value = `unpersistedEntity-${UnpersistedEntityId.generateId()}`
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

	export type BatchUpdates = (getAccessor: () => EntityAccessor) => void

	export interface EntityEventListenerMap {
		beforeUpdate: BatchUpdates
	}
	export type EntityEventType = keyof EntityEventListenerMap
	export interface AddEntityEventListener {
		(type: EntityEventType & 'beforeUpdate', listener: EntityEventListenerMap['beforeUpdate']): () => void
	}
}

export { EntityAccessor }
