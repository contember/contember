import { Acl, Input, Model } from '@contember/schema'
import { acceptFieldVisitor, getEntity } from '@contember/schema-utils'
import { InputField } from '@contember/graphql-json'
import { Authorizator } from '../acl/index.js'
import { GqlTypeName } from '../schema/utils.js'
import {
	CreateEntityRelationAllowedOperationsVisitor,
	EntityInputType,
	UpdateEntityRelationAllowedOperationsVisitor,
} from '../schema/mutations/index.js'
import { ImplementationException } from '../exception.js'
import { JsonColumnTypes } from './JsonColumnTypes.js'
import { JsonFilterTypes } from './JsonFilterTypes.js'
import { JsonTypeRegistry, listOfNonNullRef, namedRef, nonNullRef } from './JsonTypeRegistry.js'

/** JSON counterpart of `EntityInputProvider` and the create/update input visitors in `schema/mutations`. */
export class JsonInputTypes {
	private readonly createAllowedOperationsVisitor: CreateEntityRelationAllowedOperationsVisitor
	private readonly updateAllowedOperationsVisitor: UpdateEntityRelationAllowedOperationsVisitor
	/**
	 * Inputs by their arguments. Every `Without<relation>` variant of an input asks again for the relation inputs of
	 * its fields, and every relation input for the inputs of its target; on real models that repeated work dominated.
	 */
	private readonly inputs = new Map<string, string | undefined>()
	private readonly relationInputs = new Map<string, string | undefined>()

	constructor(
		private readonly schema: Model.Schema,
		private readonly authorizator: Authorizator,
		private readonly registry: JsonTypeRegistry,
		private readonly columnTypes: JsonColumnTypes,
		private readonly filterTypes: JsonFilterTypes,
	) {
		this.createAllowedOperationsVisitor = new CreateEntityRelationAllowedOperationsVisitor(authorizator)
		this.updateAllowedOperationsVisitor = new UpdateEntityRelationAllowedOperationsVisitor(authorizator)
	}

	public getInput(operation: EntityInputType, entityName: string, withoutRelation?: string): string | undefined {
		const key = `${operation}\0${entityName}\0${withoutRelation ?? ''}`
		if (this.inputs.has(key)) {
			return this.inputs.get(key)
		}
		const input = this.createInput(operation, entityName, withoutRelation)
		this.inputs.set(key, input)
		return input
	}

	private createInput(operation: EntityInputType, entityName: string, withoutRelation: string | undefined): string | undefined {
		const entity = getEntity(this.schema, entityName)
		if (entity.view) {
			return undefined
		}
		const aclOperation = operation === EntityInputType.create ? Acl.Operation.create : Acl.Operation.update
		if (this.authorizator.getEntityPermission(aclOperation, entity.name) === 'no') {
			return undefined
		}
		const withoutSuffix = withoutRelation ? GqlTypeName`Without${withoutRelation}` : ''
		const name = GqlTypeName`${entityName}${withoutSuffix}${operation}Input`
		return this.registry.inputObject(name, () => {
			const fields: Record<string, InputField> = {}
			for (const fieldName of Object.keys(entity.fields)) {
				if (fieldName === withoutRelation) {
					continue
				}
				const field = operation === EntityInputType.create
					? this.getCreateField(entity, fieldName)
					: this.getUpdateField(entity, fieldName)
				if (field !== undefined) {
					fields[fieldName] = field
				}
			}
			fields['_dummy_field_'] = [namedRef(this.columnTypes.getScalar(Model.ColumnType.Bool))]
			return fields
		})
	}

	private getCreateField(entity: Model.Entity, fieldName: string): InputField | undefined {
		return acceptFieldVisitor<InputField | undefined>(this.schema, entity, fieldName, {
			visitColumn: ({ column }) => {
				if (entity.primary === column.name && !this.authorizator.isCustomPrimaryAllowed(entity.name)) {
					return undefined
				}
				if (this.authorizator.getFieldPermissions(Acl.Operation.create, entity.name, column.name) === 'no') {
					return undefined
				}
				return [this.columnTypes.getType(column).type]
			},
			visitHasOne: context => {
				const type = this.memoizeRelationInput('create', context, () => this.getCreateRelationInput(context, false))
				return type === undefined ? undefined : [namedRef(type)]
			},
			visitHasMany: context => {
				const type = this.memoizeRelationInput('create', context, () => this.getCreateRelationInput(context, true))
				return type === undefined ? undefined : [listOfNonNullRef(type)]
			},
		})
	}

	private getUpdateField(entity: Model.Entity, fieldName: string): InputField | undefined {
		return acceptFieldVisitor<InputField | undefined>(this.schema, entity, fieldName, {
			visitColumn: ({ column }) => {
				if (entity.primary === column.name) {
					return undefined
				}
				if (this.authorizator.getFieldPermissions(Acl.Operation.update, entity.name, column.name) === 'no') {
					return undefined
				}
				return [this.columnTypes.getType(column).type]
			},
			visitHasOne: context => {
				const type = this.memoizeRelationInput('update', context, () => this.getUpdateHasOneRelationInput(context))
				return type === undefined ? undefined : [namedRef(type)]
			},
			visitHasMany: context => {
				const type = this.memoizeRelationInput('update', context, () => this.getUpdateHasManyRelationInput(context))
				return type === undefined ? undefined : [listOfNonNullRef(type)]
			},
		})
	}

	private memoizeRelationInput(
		operation: 'create' | 'update',
		{ entity, relation }: Model.AnyRelationContext,
		create: () => string | undefined,
	): string | undefined {
		const key = `${operation}\0${entity.name}\0${relation.name}`
		if (this.relationInputs.has(key)) {
			return this.relationInputs.get(key)
		}
		const input = create()
		this.relationInputs.set(key, input)
		return input
	}

	private getCreateRelationInput(
		{ entity, relation, targetEntity, targetRelation }: Model.AnyRelationContext,
		withAliasField: boolean,
	): string | undefined {
		const allowedOperations = acceptFieldVisitor(this.schema, entity, relation.name, this.createAllowedOperationsVisitor)
		const fields: Record<string, InputField> = {}

		const uniqueWhere = this.filterTypes.getEntityUniqueWhereType(targetEntity.name)
		if (allowedOperations.includes(Input.CreateRelationOperation.connect) && uniqueWhere) {
			fields[Input.CreateRelationOperation.connect] = [namedRef(uniqueWhere)]
		}
		const createInput = this.getInput(EntityInputType.create, targetEntity.name, targetRelation?.name)
		if (allowedOperations.includes(Input.CreateRelationOperation.create) && createInput !== undefined) {
			fields[Input.CreateRelationOperation.create] = [namedRef(createInput)]
		}
		if (allowedOperations.includes(Input.CreateRelationOperation.connectOrCreate) && uniqueWhere !== undefined && createInput !== undefined) {
			fields[Input.CreateRelationOperation.connectOrCreate] = [namedRef(this.getConnectOrCreateInput(entity, relation.name))]
		}
		if (Object.keys(fields).length === 0) {
			return undefined
		}
		if (withAliasField) {
			fields.alias = [namedRef(this.columnTypes.getScalar(Model.ColumnType.String))]
		}
		return this.registry.inputObject(GqlTypeName`${entity.name}Create${relation.name}EntityRelationInput`, () => fields)
	}

	private getUpdateHasOneRelationInput({ targetRelation, targetEntity, relation, entity }: Model.AnyHasOneRelationContext): string | undefined {
		const withoutRelation = targetRelation ? targetRelation.name : undefined
		const whereInput = this.getUniqueWhereInput(targetEntity)
		const createInput = this.getInput(EntityInputType.create, targetEntity.name, withoutRelation)
		const updateInput = this.getInput(EntityInputType.update, targetEntity.name, withoutRelation)
		const boolean = namedRef(this.columnTypes.getScalar(Model.ColumnType.Bool))

		const fields = this.filterAllowedOperations(entity, relation, {
			[Input.UpdateRelationOperation.connect]: whereInput ? [namedRef(whereInput)] : undefined,
			[Input.UpdateRelationOperation.create]: createInput ? [namedRef(createInput)] : undefined,
			[Input.UpdateRelationOperation.connectOrCreate]: createInput && whereInput
				? [namedRef(this.getConnectOrCreateInput(entity, relation.name))]
				: undefined,
			[Input.UpdateRelationOperation.update]: updateInput ? [namedRef(updateInput)] : undefined,
			[Input.UpdateRelationOperation.upsert]: updateInput && createInput
				? [namedRef(this.registry.inputObject(GqlTypeName`${entity.name}Upsert${relation.name}RelationInput`, () => ({
					update: [nonNullRef(updateInput)],
					create: [nonNullRef(createInput)],
				})))]
				: undefined,
			[Input.UpdateRelationOperation.disconnect]: [boolean],
			[Input.UpdateRelationOperation.delete]: [boolean],
		})
		if (Object.keys(fields).length === 0) {
			return undefined
		}
		return this.registry.inputObject(GqlTypeName`${entity.name}Update${relation.name}EntityRelationInput`, () => fields)
	}

	private getUpdateHasManyRelationInput({ entity, relation, targetEntity, targetRelation }: Model.AnyHasManyRelationContext): string | undefined {
		const withoutRelation = targetRelation ? targetRelation.name : undefined
		const whereInput = this.getUniqueWhereInput(targetEntity)
		const createInput = this.getInput(EntityInputType.create, targetEntity.name, withoutRelation)
		const updateInput = this.getInput(EntityInputType.update, targetEntity.name, withoutRelation)

		const fields = this.filterAllowedOperations(entity, relation, {
			[Input.UpdateRelationOperation.create]: createInput ? [namedRef(createInput)] : undefined,
			[Input.UpdateRelationOperation.update]: updateInput && whereInput
				? [namedRef(this.registry.inputObject(GqlTypeName`${entity.name}Update${relation.name}RelationInput`, () => ({
					by: [nonNullRef(whereInput)],
					data: [nonNullRef(updateInput)],
				})))]
				: undefined,
			[Input.UpdateRelationOperation.upsert]: updateInput && createInput && whereInput
				? [namedRef(this.registry.inputObject(GqlTypeName`${entity.name}Upsert${relation.name}RelationInput`, () => ({
					by: [nonNullRef(whereInput)],
					update: [nonNullRef(updateInput)],
					create: [nonNullRef(createInput)],
				})))]
				: undefined,
			[Input.UpdateRelationOperation.connect]: whereInput ? [namedRef(whereInput)] : undefined,
			[Input.UpdateRelationOperation.connectOrCreate]: createInput && whereInput
				? [namedRef(this.getConnectOrCreateInput(entity, relation.name))]
				: undefined,
			[Input.UpdateRelationOperation.disconnect]: whereInput ? [namedRef(whereInput)] : undefined,
			[Input.UpdateRelationOperation.delete]: whereInput ? [namedRef(whereInput)] : undefined,
		})
		if (Object.keys(fields).length === 0) {
			return undefined
		}
		fields.alias = [namedRef(this.columnTypes.getScalar(Model.ColumnType.String))]
		return this.registry.inputObject(GqlTypeName`${entity.name}Update${relation.name}EntityRelationInput`, () => fields)
	}

	private getConnectOrCreateInput(entity: Model.Entity, relationName: string): string {
		return acceptFieldVisitor<string>(this.schema, entity, relationName, {
			visitColumn: () => {
				throw new ImplementationException()
			},
			visitRelation: ({ targetEntity, targetRelation, relation }) => {
				const uniqueWhere = this.filterTypes.getEntityUniqueWhereType(targetEntity.name)
				const createInput = this.getInput(EntityInputType.create, targetEntity.name, targetRelation?.name)
				if (!uniqueWhere || !createInput) {
					throw new ImplementationException()
				}
				return this.registry.inputObject(GqlTypeName`${entity.name}ConnectOrCreate${relation.name}RelationInput`, () => ({
					connect: [nonNullRef(uniqueWhere)],
					create: [nonNullRef(createInput)],
				}))
			},
		})
	}

	private getUniqueWhereInput(targetEntity: Model.Entity): string | undefined {
		if (this.authorizator.getEntityPermission(Acl.Operation.read, targetEntity.name) === 'no') {
			return undefined
		}
		const uniqueWhere = this.filterTypes.getEntityUniqueWhereType(targetEntity.name)
		if (!uniqueWhere) {
			throw new ImplementationException()
		}
		return uniqueWhere
	}

	private filterAllowedOperations(
		entity: Model.Entity,
		relation: Model.Relation,
		fields: Record<string, InputField | undefined>,
	): Record<string, InputField> {
		const allowedOperations: readonly string[] = acceptFieldVisitor(this.schema, entity, relation.name, this.updateAllowedOperationsVisitor)
		const result: Record<string, InputField> = {}
		for (const [key, value] of Object.entries(fields)) {
			if (value !== undefined && allowedOperations.includes(key)) {
				result[key] = value
			}
		}
		return result
	}
}
