export type PrimaryValue = string | number

type Atomic = PrimaryValue | boolean | null | object
export type ColumnValue = Atomic | Atomic[]

export type GenericValueLike<T> = T | PromiseLike<T> | (() => T | PromiseLike<T>)

export type ColumnValueLike = GenericValueLike<ColumnValue>
export type PrimaryValueLike = GenericValueLike<PrimaryValue>

export interface CreateInput
{
  [column: string]: ColumnValue | CreateOneRelationInput | CreateManyRelationInput
}

export type CreateOneRelationInput = ConnectRelationInput | CreateRelationInput
export type CreateManyRelationInput = CreateOneRelationInput[]

export type RelationConnectionInput = { [field: string]: PrimaryValue };
export type ConnectRelationInput = { connect: RelationConnectionInput };
export type CreateRelationInput = { create: CreateInput };
