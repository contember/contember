import { Acl } from '@contember/schema'
import type { Input, Model } from '@contember/schema'
import type { CheckedPrimary } from './CheckedPrimary.js'
import type { InsertBuilder } from './insert/index.js'
import type { Mapper } from './Mapper.js'
import type { MutationResultList } from './Result.js'
import type { MapperInput } from './types.js'
import type { UpdateBuilder } from './update/index.js'

export class MutationAccess {
	constructor(
		private readonly mapper: Mapper,
		public readonly relationPath: readonly Model.AnyRelationContext[] = [],
	) {}

	public get isRoot(): boolean {
		return this.relationPath.length === 0
	}

	public get relationContext(): Model.AnyRelationContext | undefined {
		return this.relationPath[this.relationPath.length - 1]
	}

	public through(relationContext: Model.AnyRelationContext): MutationAccess {
		return new MutationAccess(this.mapper, [...this.relationPath, relationContext])
	}

	public selectField(entity: Model.Entity, where: Input.UniqueWhere | CheckedPrimary, fieldName: string) {
		return this.mapper.selectFieldWithAccess(this, entity, where, fieldName)
	}

	public getPrimaryValue(entity: Model.Entity, where: Input.UniqueWhere | CheckedPrimary) {
		return this.mapper.getPrimaryValueWithAccess(this, entity, where)
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
		operation: Acl.Operation.create | Acl.Operation.update = Acl.Operation.update,
	): Promise<MutationResultList> {
		return this.mapper.connectJunctionWithAccess(this, entity, relation, thisPrimary, otherPrimary, operation)
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
