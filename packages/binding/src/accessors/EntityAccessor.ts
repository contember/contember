import { BindingError } from '../BindingError'
import { PlaceholderGenerator, ReferenceMarker } from '../markers'
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
} from '../treeParameters'
import { Accessor } from './Accessor'
import { EntityForRemovalAccessor } from './EntityForRemovalAccessor'
import { EntityListAccessor } from './EntityListAccessor'
import { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'
import { FieldAccessor } from './FieldAccessor'
import { GetSubTreeRoot } from './GetSubTreeRoot'

class EntityAccessor extends Accessor implements Errorable {
	public readonly runtimeId: string | EntityAccessor.UnpersistedEntityId

	public constructor(
		key: string | EntityAccessor.UnpersistedEntityId,
		public readonly typename: string | undefined,
		private readonly fieldData: EntityAccessor.FieldData,
		public readonly getSubTreeRoot: GetSubTreeRoot,
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

	public *[Symbol.iterator](): Generator<[FieldName, EntityAccessor.NestedAccessor]> {
		for (const [placeholderName, fieldDatum] of this.fieldData) {
			if (fieldDatum.accessor === null) {
				continue
			}
			yield [placeholderName, fieldDatum.accessor]
		}
	}

	public getField(fieldName: FieldName): EntityAccessor.NestedAccessor
	public getField(
		fieldName: FieldName,
		expectedCount: ReferenceMarker.ReferenceConstraints['expectedCount'],
		filter: ReferenceMarker.ReferenceConstraints['filter'],
	): EntityAccessor.NestedAccessor | null
	public getField(
		fieldName: FieldName,
		expectedCount: ReferenceMarker.ReferenceConstraints['expectedCount'],
		filter: ReferenceMarker.ReferenceConstraints['filter'],
		reducedBy: ReferenceMarker.ReferenceConstraints['reducedBy'],
	): EntityAccessor.NestedAccessor | null
	public getField(
		fieldName: FieldName,
		expectedCount?: ReferenceMarker.ReferenceConstraints['expectedCount'],
		filter?: ReferenceMarker.ReferenceConstraints['filter'],
		reducedBy?: ReferenceMarker.ReferenceConstraints['reducedBy'],
	): EntityAccessor.NestedAccessor | null {
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

		return this.getFieldByPlaceholder(placeholder)
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
	 *
	 * Please keep in mind that this method signature is literally impossible to implement safely. The generic parameters
	 * are really just a way to succinctly write a type cast. Nothing more, really.
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
				`Trying to access the field '${fieldName}'${
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

	/**
	 * @internal
	 */
	public getFieldByPlaceholder(placeholderName: FieldName): EntityAccessor.NestedAccessor | null {
		const record = this.fieldData.get(placeholderName)
		if (record === undefined) {
			throw new BindingError('EntityAccessor: unknown field')
		}
		return record.accessor
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

	export interface FieldDatum {
		accessor: NestedAccessor | null
	}
	export type NestedAccessor = EntityAccessor | EntityForRemovalAccessor | EntityListAccessor | FieldAccessor

	export type FieldData = Map<FieldName, FieldDatum>

	export type BatchUpdates = (getAccessor: () => EntityAccessor) => void
	export type AfterUpdate = (accessor: undefined | EntityAccessor | EntityForRemovalAccessor) => void

	export interface EntityEventListenerMap {
		beforeUpdate: BatchUpdates
		afterUpdate: AfterUpdate
	}
	export type EntityEventType = keyof EntityEventListenerMap
	export interface AddEntityEventListener {
		(type: 'beforeUpdate', listener: EntityEventListenerMap['beforeUpdate']): () => void
		(type: 'afterUpdate', listener: EntityEventListenerMap['afterUpdate']): () => void
	}
}

export { EntityAccessor }
