export type PrimaryValue = string | number

type Atomic = PrimaryValue | boolean | null | object
export type ColumnValue = Atomic | Atomic[]

export type GenericValueLike<T> = T | PromiseLike<T> | (() => T | PromiseLike<T>)

export type ColumnValueLike = GenericValueLike<ColumnValue>
export type PrimaryValueLike = GenericValueLike<PrimaryValue>

export interface CreateInput
{
  [column: string]: ColumnValue | CreateOneRelationInput | CreateOneRelationInput[]
}

export type CreateOneRelationInput = ConnectRelationInput | CreateRelationInput
export type CreateManyRelationInput = CreateOneRelationInput[]

export type RelationConnectionInput = { [field: string]: PrimaryValue };
export type ConnectRelationInput = { connect: RelationConnectionInput };
export const isConnectRelationInput = (input: CreateOneRelationInput): input is ConnectRelationInput => (input as ConnectRelationInput).connect !== undefined

export type CreateRelationInput = { create: CreateInput };
export const isCreateRelationInput = (input: CreateOneRelationInput): input is CreateRelationInput => (input as CreateRelationInput).create !== undefined
