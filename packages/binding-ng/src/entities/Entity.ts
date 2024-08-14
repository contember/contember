import {
	ErrorAccessor,
	FieldValue,
	HasManyRelation,
	HasOneRelation,
	PlaceholderGenerator,
	RuntimeId,
	SchemaEntity,
} from '@contember/binding-common'
import { EntityField } from './EntityField'
import { EntityHasOneRelationship } from './EntityHasOneRelationship'
import { EntityHasManyRelationship } from './EntityHasManyRelationship'
import { EntityStore } from './EntityStore'
import { ErrorSet } from '../ErrorSet'


let counter = 0

export class Entity {
	public readonly globalKey: string

	#id: RuntimeId
	#isScheduledForDeletion = false

	#fields: Map<string, EntityField<any>> = new Map()

	#hasOneRelations: Map<string, EntityHasOneRelationship> = new Map()
	#hasManyRelations: Map<string, EntityHasManyRelationship> = new Map()
	#errors: ErrorSet | undefined
	constructor(
		id: RuntimeId,
		private readonly entitySchema: SchemaEntity,
		private readonly identityMap: EntityStore,
	) {
		this.#id = id
		this.globalKey = `${entitySchema.name}--${counter++}`
	}

	get hasUnpersistedChanges(): boolean {
		return this.#isScheduledForDeletion || [...this.#fields.values()].some(field => field.hasUnpersistedChanges)
	}


	get errors(): ErrorAccessor | undefined {
		return this.#errors?.errors
	}

	addError(error: ErrorAccessor.Error): ErrorAccessor.ClearError {
		this.#errors ??= new ErrorSet()
		return this.#errors.addError(error)
	}

	clearErrors(): void {
		this.#errors = undefined
	}

	get existsOnServer(): boolean {
		return this.#id.existsOnServer
	}

	get id(): RuntimeId {
		return this.#id
	}

	get schema(): SchemaEntity {
		return this.entitySchema
	}

	get entityName(): string {
		return this.entitySchema.name
	}


	getFieldValue(name: string): FieldValue {
		return this.getField(name).value
	}

	getFieldPersistedValue(name: string): FieldValue | undefined {
		return this.getField(name).persistedValue
	}

	setFieldPersistedValue({ fieldName, value }: { fieldName: string; value: FieldValue }): void {
		const field = this.getField(fieldName)
		field.setPersistedValue({ value })
	}

	setHasOneRelationPersistedValue({ relation, entity, matches }: {
		relation: HasOneRelation
		entity: Entity | null
		matches: boolean
	}): void {
		const relationship = this.getOrCreateHasOneRelationship(relation)
		relationship.setPersistedValue({ relation, entity, matches })
	}

	getHasOneValue({ relation }: { relation: HasOneRelation }): Entity {
		const relationship = this.getOrCreateHasOneRelationship(relation)
		let entity = relationship.getValue(relation)
		if (!entity) {
			entity = this.identityMap.createNewEntity(relationship.schema.targetEntity)
			relationship.setValue({ relation, entity })
		}
		return entity
	}

	setHasManyRelationPersistedValue({ relation, value }: {
		relation: HasManyRelation
		value: Entity[]
	}): void {
		const relationship = this.getOrCreateHasManyRelation(relation)
		relationship.setPersistedValue({ relation, value })
	}

	private getOrCreateHasOneRelationship(relation: HasOneRelation): EntityHasOneRelationship {
		const simplifiedPlaceholder = PlaceholderGenerator.getHasOneRelationPlaceholder({ ...relation, filter: undefined })
		let relationship = this.#hasOneRelations.get(simplifiedPlaceholder)
		if (!relationship) {
			const relationSchema = this.entitySchema.fields.get(relation.field)
			if (!relationSchema || relationSchema.__typename !== '_Relation') {
				throw new Error(`Relation ${relation.field} not found in entity ${this.entitySchema.name}`)
			}
			relationship = new EntityHasOneRelationship(this, relationSchema)
			this.#hasOneRelations.set(simplifiedPlaceholder, relationship)
		}
		return relationship
	}

	getField<Value extends FieldValue = FieldValue>(fieldName: string): EntityField<Value> {
		const field = this.#fields.get(fieldName)
		if (field) {
			return field
		}
		const fieldSchema = this.entitySchema.fields.get(fieldName)
		if (!fieldSchema || fieldSchema.__typename !== '_Column') {
			throw new Error(`Field ${fieldName} not found in entity ${this.entitySchema.name}`)
		}
		const newField = new EntityField<Value>(this, fieldSchema)
		this.#fields.set(fieldName, newField)
		return newField
	}

	private getOrCreateHasManyRelation(relation: HasManyRelation): EntityHasManyRelationship {
		const relationship = this.#hasManyRelations.get(relation.field)
		if (relationship) {
			return relationship
		}
		const relationSchema = this.entitySchema.fields.get(relation.field)
		if (!relationSchema || relationSchema.__typename !== '_Relation') {
			throw new Error(`Relation ${relation.field} not found in entity ${this.entitySchema.name}`)
		}
		const newRelationship = new EntityHasManyRelationship(this, relationSchema)
		this.#hasManyRelations.set(relation.field, newRelationship)
		return newRelationship
	}
}
