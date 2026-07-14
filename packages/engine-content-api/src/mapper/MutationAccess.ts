import { Acl } from '@contember/schema'
import type { Input, Model } from '@contember/schema'
import { createPredicateContext } from '../acl/PredicateContext.js'
import type { PredicateContext, PredicatePermissionScope } from '../acl/PredicateContext.js'
import type { CheckedPrimary } from './CheckedPrimary.js'
import type { InsertBuilder } from './insert/index.js'
import type { Mapper } from './Mapper.js'
import type { MutationResultList } from './Result.js'
import type { MapperInput } from './types.js'
import type { UpdateBuilder } from './update/index.js'

export class MutationAccess {
	constructor(
		private readonly mapper: Mapper,
		private readonly permissionScope: PredicatePermissionScope = 'root',
		private readonly throughPath: readonly Model.AnyRelationContext[] = [],
	) {}

	/**
	 * Nested mutation access selects through-inclusive permissions, but never proves that a parent
	 * row was evaluated. Keeping this witness-free prevents ACL predicate simplification in writes.
	 */
	public get predicateContext(): PredicateContext {
		return createPredicateContext(this.permissionScope)
	}

	public through(relationContext: Model.AnyRelationContext): MutationAccess {
		return new MutationAccess(this.mapper, 'through', [...this.throughPath, relationContext])
	}

	public selectField(entity: Model.Entity, where: Input.UniqueWhere | CheckedPrimary, fieldName: string) {
		return this.mapper.selectFieldWithAccess(this, entity, where, fieldName)
	}

	public getPrimaryValue(entity: Model.Entity, where: Input.UniqueWhere | CheckedPrimary) {
		return this.mapper.getPrimaryValueWithAccess(this, entity, where)
	}

	public getConnectedPrimaryValue(
		context: Model.ManyHasManyOwningContext | Model.ManyHasManyInverseContext,
		sourcePrimary: Input.PrimaryValue,
		where: Input.UniqueWhere,
	) {
		return this.mapper.getConnectedPrimaryValueWithAccess(this, context, sourcePrimary, where)
	}

	public insert(
		entity: Model.Entity,
		data: MapperInput.CreateDataInput,
		builderCb: (builder: InsertBuilder) => void = () => {},
	): Promise<MutationResultList> {
		return this.mapper.insertWithAccess(this, entity, data, builderCb)
	}

	public update(
		entity: Model.Entity,
		by: Input.UniqueWhere | CheckedPrimary,
		data: MapperInput.UpdateDataInput,
		filter?: Input.OptionalWhere,
	): Promise<MutationResultList> {
		return this.mapper.updateWithAccess(this, entity, by, data, filter)
	}

	public updateInternal(
		entity: Model.Entity,
		by: Input.UniqueWhere | CheckedPrimary,
		builderCb: (builder: UpdateBuilder) => void,
	): Promise<MutationResultList> {
		return this.mapper.updateInternalWithAccess(this, entity, by, builderCb)
	}

	public upsert(
		entity: Model.Entity,
		by: Input.UniqueWhere | CheckedPrimary,
		update: MapperInput.UpdateDataInput,
		create: MapperInput.CreateDataInput,
		filter?: Input.OptionalWhere,
	): Promise<MutationResultList> {
		return this.mapper.upsertWithAccess(this, entity, by, update, create, filter)
	}

	public delete(entity: Model.Entity, by: Input.UniqueWhere | CheckedPrimary, filter?: Input.OptionalWhere): Promise<MutationResultList> {
		return this.mapper.deleteWithAccess(this, entity, by, filter)
	}

	public connectJunction(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwningRelation | Model.ManyHasManyInverseRelation,
		thisPrimary: Input.PrimaryValue,
		otherPrimary: Input.PrimaryValue,
		operation?: MutationJunctionOperation,
	): Promise<MutationResultList>
	public connectJunction(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwningRelation | Model.ManyHasManyInverseRelation,
		thisPrimary: Input.PrimaryValue,
		otherPrimary: Input.PrimaryValue,
		operations: MutationJunctionOperations,
	): Promise<MutationResultList>
	public connectJunction(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwningRelation | Model.ManyHasManyInverseRelation,
		thisPrimary: Input.PrimaryValue,
		otherPrimary: Input.PrimaryValue,
		operationsOrOperation?: MutationJunctionOperations | MutationJunctionOperation,
	): Promise<MutationResultList> {
		return this.mapper.connectJunctionWithAccess(
			this,
			entity,
			relation,
			thisPrimary,
			otherPrimary,
			normalizeMutationJunctionOperations(operationsOrOperation),
		)
	}

	public disconnectJunction(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwningRelation | Model.ManyHasManyInverseRelation,
		thisPrimary: Input.PrimaryValue,
		otherPrimary: Input.PrimaryValue,
	): Promise<MutationResultList> {
		return this.mapper.disconnectJunctionWithAccess(this, entity, relation, thisPrimary, otherPrimary)
	}
}

export interface MutationJunctionOperations {
	source: MutationJunctionOperation
	target: MutationJunctionOperation
}

export type MutationJunctionOperation = Acl.Operation.create | Acl.Operation.update

export const normalizeMutationJunctionOperations = (
	operationsOrOperation?: MutationJunctionOperations | MutationJunctionOperation,
): MutationJunctionOperations => {
	const operation = operationsOrOperation ?? Acl.Operation.update
	return typeof operation === 'string' ? { source: operation, target: operation } : operation
}
