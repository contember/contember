import { BindingError } from '../BindingError'
import { PlaceholderGenerator } from '../markers'
import {
	DesugaredHasManyRelation,
	DesugaredHasOneRelation,
	DesugaredRelativeEntityList,
	DesugaredRelativeSingleEntity,
	DesugaredRelativeSingleField,
	ExpectedEntityCount,
	FieldName,
	FieldValue,
	HasManyRelation,
	HasOneRelation,
	RelativeEntityList,
	RelativeSingleEntity,
	RelativeSingleField,
} from '../treeParameters'
import { Accessor } from './Accessor'
import { EntityListAccessor } from './EntityListAccessor'
import { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'
import { FieldAccessor } from './FieldAccessor'

class EntityAccessor extends Accessor implements Errorable {
	public readonly runtimeId: string | EntityAccessor.UnpersistedEntityId

	public constructor(
		key: string | EntityAccessor.UnpersistedEntityId,
		public readonly typeName: string | undefined,
		private readonly fieldData: EntityAccessor.FieldData,
		public readonly errors: ErrorAccessor[],
		public readonly hasUnpersistedChanges: boolean,
		public readonly addEventListener: EntityAccessor.AddEntityEventListener,
		public readonly batchUpdates: EntityAccessor.BatchUpdates,
		public readonly connectEntityAtField: EntityAccessor.ConnectEntityAtField | undefined,
		public readonly disconnectEntityAtField: EntityAccessor.DisconnectEntityAtField | undefined,
		public readonly deleteEntity: EntityAccessor.DeleteEntity | undefined,
	) {
		super()
		this.runtimeId = key || new EntityAccessor.UnpersistedEntityId()
	}

	public get primaryKey(): string | undefined {
		return typeof this.runtimeId === 'string' ? this.runtimeId : undefined
	}

	public get existsOnServer(): boolean {
		return typeof this.runtimeId === 'string'
	}

	public get key(): string {
		return typeof this.runtimeId === 'string' ? this.runtimeId : this.runtimeId.value
	}

	public getField(fieldName: FieldName): FieldAccessor
	public getField(
		hasOneRelation: HasOneRelation | DesugaredHasOneRelation,
		expectedCount: ExpectedEntityCount.UpToOne,
	): EntityAccessor
	public getField(
		hasManyRelation: HasManyRelation | DesugaredHasManyRelation,
		expectedCount: ExpectedEntityCount.PossiblyMany,
	): EntityListAccessor
	public getField(
		fieldNameOrRelation:
			| FieldName
			| HasOneRelation
			| HasManyRelation
			| DesugaredHasOneRelation
			| DesugaredHasManyRelation,
		expectedCount?: ExpectedEntityCount,
	): EntityAccessor.NestedAccessor {
		let placeholder: FieldName

		if (typeof fieldNameOrRelation === 'string') {
			placeholder = fieldNameOrRelation
		} else if (expectedCount === ExpectedEntityCount.UpToOne) {
			placeholder = PlaceholderGenerator.getHasOneRelationPlaceholder(
				fieldNameOrRelation as HasOneRelation | DesugaredHasOneRelation,
			)
		} else if (expectedCount === ExpectedEntityCount.PossiblyMany) {
			placeholder = PlaceholderGenerator.getHasManyRelationPlaceholder(
				fieldNameOrRelation as HasManyRelation | DesugaredHasManyRelation,
			)
		} else {
			throw new BindingError()
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
		const hasOneRelationPath: Array<HasOneRelation | DesugaredHasOneRelation> =
			typeof entity === 'string'
				? [
						{
							connections: undefined,
							forceCreation: false,
							isNonbearing: false,
							field: entity,
							reducedBy: undefined,
							filter: undefined,
						},
				  ]
				: entity.hasOneRelationPath
		for (const hasOneRelation of hasOneRelationPath) {
			relativeTo = relativeTo.getField(hasOneRelation, ExpectedEntityCount.UpToOne)
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
					nestedEntity.typeName ? ` of the '${nestedEntity.typeName}' entity` : ''
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
			fieldName = PlaceholderGenerator.getHasManyRelationPlaceholder(entityList.hasManyRelation)
		}

		const field = nestedEntity.getField(fieldName)

		if (!(field instanceof EntityListAccessor)) {
			throw new BindingError(
				`Trying to access the entity list '${field}'${
					nestedEntity.typeName ? ` of the '${nestedEntity.typeName}' entity` : ''
				} but it does not exist.`,
			)
		}
		return field
	}

	/**
	 * @internal
	 */
	public getFieldByPlaceholder(placeholderName: FieldName): EntityAccessor.NestedAccessor {
		const record = this.fieldData.get(placeholderName)
		if (record === undefined) {
			throw new BindingError(`EntityAccessor: unknown field '${placeholderName}'.`)
		}
		return record.getAccessor()
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
		getAccessor(): NestedAccessor
	}
	export type NestedAccessor = EntityAccessor | EntityListAccessor | FieldAccessor

	export type FieldData = Map<FieldName, FieldDatum>

	export type BatchUpdates = (performUpdates: EntityAccessor.BatchUpdatesHandler) => void
	export type BatchUpdatesHandler = (getAccessor: () => EntityAccessor) => void
	export type ConnectEntityAtField = (field: FieldName, entityToConnectOrItsKey: EntityAccessor | string) => void
	export type DeleteEntity = () => void
	export type DisconnectEntityAtField = (field: FieldName) => void
	export type UpdateListener = (accessor: EntityAccessor) => void

	export interface EntityEventListenerMap {
		beforeUpdate: BatchUpdatesHandler
		update: UpdateListener
	}
	export type EntityEventType = keyof EntityEventListenerMap
	export interface AddEntityEventListener {
		(type: 'beforeUpdate', listener: EntityEventListenerMap['beforeUpdate']): () => void
		(type: 'update', listener: EntityEventListenerMap['update']): () => void
	}
}

export { EntityAccessor }
