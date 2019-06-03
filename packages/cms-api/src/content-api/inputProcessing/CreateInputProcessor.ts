import { Input, Model } from 'cms-common'

interface CreateInputProcessor<T = void> {
	processColumn(context: CreateInputProcessor.ColumnContext): Promise<T>

	processManyHasManyInversedConnect(
		context: CreateInputProcessor.ManyHasManyInversedContext<Input.UniqueWhere>
	): Promise<T>

	processManyHasManyInversedCreate(
		context: CreateInputProcessor.ManyHasManyInversedContext<Input.CreateDataInput>
	): Promise<T>

	processManyHasManyOwnerConnect(context: CreateInputProcessor.ManyHasManyOwnerContext<Input.UniqueWhere>): Promise<T>

	processManyHasManyOwnerCreate(
		context: CreateInputProcessor.ManyHasManyOwnerContext<Input.CreateDataInput>
	): Promise<T>

	processManyHasOneConnect(context: CreateInputProcessor.ManyHasOneContext<Input.UniqueWhere>): Promise<T>

	processManyHasOneCreate(context: CreateInputProcessor.ManyHasOneContext<Input.CreateDataInput>): Promise<T>

	processOneHasManyConnect(context: CreateInputProcessor.OneHasManyContext<Input.UniqueWhere>): Promise<T>

	processOneHasManyCreate(context: CreateInputProcessor.OneHasManyContext<Input.CreateDataInput>): Promise<T>

	processOneHasOneInversedConnect(context: CreateInputProcessor.OneHasOneInversedContext<Input.UniqueWhere>): Promise<T>

	processOneHasOneInversedCreate(
		context: CreateInputProcessor.OneHasOneInversedContext<Input.CreateDataInput>
	): Promise<T>

	processOneHasOneOwnerConnect(context: CreateInputProcessor.OneHasOneOwnerContext<Input.UniqueWhere>): Promise<T>

	processOneHasOneOwnerCreate(context: CreateInputProcessor.OneHasOneOwnerContext<Input.CreateDataInput>): Promise<T>
}

namespace CreateInputProcessor {
	export interface ColumnContext {
		entity: Model.Entity
		column: Model.AnyColumn
		input: Input.ColumnValue | undefined
	}

	export interface ManyHasManyInversedContext<I> {
		entity: Model.Entity
		relation: Model.ManyHasManyInversedRelation
		targetEntity: Model.Entity
		targetRelation: Model.ManyHasManyOwnerRelation
		input: I
	}

	export interface ManyHasManyOwnerContext<I> {
		entity: Model.Entity
		relation: Model.ManyHasManyOwnerRelation
		targetEntity: Model.Entity
		targetRelation: Model.ManyHasManyInversedRelation | null
		input: I
	}

	export interface ManyHasOneContext<I> {
		entity: Model.Entity
		relation: Model.ManyHasOneRelation
		targetEntity: Model.Entity
		targetRelation: Model.OneHasManyRelation | null
		input: I
	}

	export interface OneHasManyContext<I> {
		entity: Model.Entity
		relation: Model.OneHasManyRelation
		targetEntity: Model.Entity
		targetRelation: Model.ManyHasOneRelation
		input: I
	}

	export interface OneHasOneInversedContext<I> {
		entity: Model.Entity
		relation: Model.OneHasOneInversedRelation
		targetEntity: Model.Entity
		targetRelation: Model.OneHasOneOwnerRelation
		input: I
	}

	export interface OneHasOneOwnerContext<I> {
		entity: Model.Entity
		relation: Model.OneHasOneOwnerRelation
		targetEntity: Model.Entity
		targetRelation: Model.OneHasOneInversedRelation | null
		input: I
	}
}

export default CreateInputProcessor
