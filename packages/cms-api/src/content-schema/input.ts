export interface ConnectRelationInput
{
  connect: UniqueWhere
}

export interface CreateRelationInput
{
  create: CreateDataInput
}

export interface DisconnectSpecifiedRelationInput
{
  disconnect: UniqueWhere
}

export interface DeleteSpecifiedRelationInput
{
  delete: UniqueWhere
}

export interface UpdateSpecifiedRelationInput
{
  update: { where: UniqueWhere, data: UpdateDataInput }
}

export interface UpsertSpecifiedRelationInput
{
  upsert: { where: UniqueWhere, update: UpdateDataInput, create: CreateDataInput }
}

export interface DisconnectRelationInput
{
  disconnect: true
}

export interface UpdateRelationInput
{
  update: UpdateDataInput
}

export interface DeleteRelationInput
{
  delete: true
}

export interface UpsertRelationInput
{
  upsert: { update: UpdateDataInput, create: CreateDataInput }
}

export interface CreateDataInput
{
  [column: string]: ColumnValue | CreateOneRelationInput | CreateManyRelationInput
}

export type CreateOneRelationInput = ConnectRelationInput | CreateRelationInput
export type CreateManyRelationInput = CreateOneRelationInput[]

export interface UpdateDataInput
{
  [column: string]: ColumnValue | UpdateOneRelationInput | UpdateManyRelationInput
}

export interface UpdateInput
{
  where: UniqueWhere
  data: UpdateDataInput
}

export interface CreateInput
{
  data: CreateDataInput
}

export interface DeleteInput
{
  where: UniqueWhere
}

export interface UniqueQueryInput
{
  where: UniqueWhere
}

export interface ListQueryInput
{
  where?: Where
}

export type UpdateOneRelationInput =
  CreateRelationInput
  | ConnectRelationInput
  | DeleteRelationInput
  | DisconnectRelationInput
  | UpdateRelationInput
  | UpsertRelationInput
export type UpdateManyRelationInput = Array<CreateRelationInput
  | ConnectRelationInput
  | DeleteSpecifiedRelationInput
  | DisconnectSpecifiedRelationInput
  | UpdateSpecifiedRelationInput
  | UpsertSpecifiedRelationInput>

export interface Condition<T>
{
  and?: Array<Condition<T>>,
  or?: Array<Condition<T>>,
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

export interface UniqueWhere
{
  [field: string]: PrimaryValue
}

export interface ComposedWhere
{
  and?: Where[]
  or?: Where[]
  not?: Where
}

interface ColumnWhere
{
  [name: string]: Condition<any>
}

interface RelationWhere
{
  [name: string]: Where
}

export type Where = ComposedWhere & ColumnWhere & RelationWhere
