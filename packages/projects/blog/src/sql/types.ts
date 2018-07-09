export type PrimaryValue = string | number

type Atomic = PrimaryValue | boolean | null | object
export type ColumnValue = Atomic | Atomic[]

export type GenericValueLike<T> = T | PromiseLike<T> | (() => T | PromiseLike<T>)

export type ColumnValueLike = GenericValueLike<ColumnValue>
export type PrimaryValueLike = GenericValueLike<PrimaryValue>

export type UniqueWhere = { [field: string]: PrimaryValue }

export type ConnectRelationInput = { connect: UniqueWhere }
export type DisconnectSpecifiedRelationInput = { disconnect: UniqueWhere }
export type DeleteSpecifiedRelationInput = { delete: UniqueWhere }
export type UpdateSpecifiedRelationInput = { where: UniqueWhere, update: UpdateInput }
export type UpsertSpecifiedRelationInput = { where: UniqueWhere, update: UpdateInput, create: CreateInput }
export type DisconnectRelationInput = { disconnect: true }
export type UpdateRelationInput = { update: UpdateInput }
export type DeleteOneRelationInput = { delete: true }
export type UpsertRelationInput = { update: UpdateInput, create: CreateInput }
export type CreateRelationInput = { create: CreateInput }


export interface CreateInput
{
  [column: string]: ColumnValue | CreateOneRelationInput | CreateManyRelationInput
}

export type CreateOneRelationInput = ConnectRelationInput | CreateRelationInput
export type CreateManyRelationInput = CreateOneRelationInput[]


export interface UpdateInput
{
  [column: string]: ColumnValue | UpdateOneRelationInput | UpdateManyRelationInput
}

export type UpdateOneRelationInput = CreateRelationInput | ConnectRelationInput | DeleteOneRelationInput | DisconnectRelationInput | UpdateRelationInput | UpsertRelationInput
export type UpdateManyRelationInput = (CreateRelationInput | ConnectRelationInput | DeleteSpecifiedRelationInput | DisconnectSpecifiedRelationInput| UpdateSpecifiedRelationInput | UpsertSpecifiedRelationInput)
