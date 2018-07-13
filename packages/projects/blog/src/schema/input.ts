export type ConnectRelationInput = { connect: UniqueWhere }
export type CreateRelationInput = { create: CreateInput }

export type DisconnectSpecifiedRelationInput = { disconnect: UniqueWhere }
export type DeleteSpecifiedRelationInput = { delete: UniqueWhere }
export type UpdateSpecifiedRelationInput = { update: { where: UniqueWhere, data: UpdateInput } }
export type UpsertSpecifiedRelationInput = { upsert: { where: UniqueWhere, update: UpdateInput, create: CreateInput } }

export type DisconnectRelationInput = { disconnect: true }
export type UpdateRelationInput = { update: UpdateInput }
export type DeleteRelationInput = { delete: true }
export type UpsertRelationInput = { upsert: { update: UpdateInput, create: CreateInput } }

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

export type UpdateOneRelationInput =
  CreateRelationInput
  | ConnectRelationInput
  | DeleteRelationInput
  | DisconnectRelationInput
  | UpdateRelationInput
  | UpsertRelationInput
export type UpdateManyRelationInput = (
  CreateRelationInput
  | ConnectRelationInput
  | DeleteSpecifiedRelationInput
  | DisconnectSpecifiedRelationInput
  | UpdateSpecifiedRelationInput
  | UpsertSpecifiedRelationInput
  )[]

export interface Condition<T>
{
  and?: Condition<T>[],
  or?: Condition<T>[],
  not?: Condition<T>,

  eq?: T,
  null?: boolean,
  notEq?: T,
  in?: T[],
  notIn?: T[],
  lt?: T,
  lte?: T,
  gt?: T,
  gte?: T,
}

export type PrimaryValue = string | number

type Atomic = PrimaryValue | boolean | null | object
export type ColumnValue = Atomic | Atomic[]

export type GenericValueLike<T> = T | PromiseLike<T> | (() => T | PromiseLike<T>)

export type ColumnValueLike = GenericValueLike<ColumnValue>
export type PrimaryValueLike = GenericValueLike<PrimaryValue>

export type UniqueWhere = { [field: string]: PrimaryValue }

export type ComposedWhere = {
  and?: Where[]
  or?: Where[]
  not?: Where
}

//workaround
type ColumnWhere = { [name: string]: Condition<any> }
type RelationWhere = { [name: string]: /* Where */ any }

export type Where = ComposedWhere & ColumnWhere & RelationWhere
