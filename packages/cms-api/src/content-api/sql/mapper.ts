import * as Knex from "knex"
import { ColumnValue, ColumnValueLike, CreateDataInput, PrimaryValue, UniqueWhere, UpdateDataInput } from "../../content-schema/input"
import { isUniqueWhere } from "../../content-schema/inputUtils"
import { Entity, ManyHasManyOwnerRelation, Schema } from "../../content-schema/model"
import { acceptEveryFieldVisitor, getColumnName, getEntity } from "../../content-schema/modelUtils"
import { promiseAllObject } from "../../utils/promises"
import InsertVisitor from "./insertVisitor"
import UpdateVisitor from "./updateVisitor"
import { resolveValue } from "./utils"

export class InsertBuilder
{
  private rowData: { [columnName: string]: PromiseLike<ColumnValue> } = {}

  private tableName: string
  private primaryColumn: string
  private db: Knex
  private insertPromise: Promise<PrimaryValue>

  constructor(tableName: string, primaryColumn: string, db: Knex, firer: PromiseLike<void>)
  {
    this.tableName = tableName
    this.primaryColumn = primaryColumn
    this.db = db
    this.insertPromise = this.createInsertPromise(firer)
  }

  public addColumnData(columnName: string, value: ColumnValueLike)
  {
    this.rowData[columnName] = resolveValue(value)
  }

  public async insertRow(): Promise<PrimaryValue>
  {
    return this.insertPromise
  }

  private async createInsertPromise(firer: PromiseLike<void>)
  {
    await firer
    const qb = this.db(this.tableName)
    const rowData = await promiseAllObject(this.rowData)
    const returning = await qb.insert(rowData, this.primaryColumn)

    return returning[0]
  }
}

export class UpdateBuilder
{
  private rowData: { [columnName: string]: PromiseLike<ColumnValue> } = {}

  private tableName: string
  private db: Knex
  private where: { [columnName: string]: PromiseLike<ColumnValue> } = {}

  private updatePromise: Promise<number>

  constructor(tableName: string, where: { [columnName: string]: ColumnValueLike }, db: Knex, firer: PromiseLike<void>)
  {
    this.tableName = tableName
    this.db = db
    for (const columnName in where) {
      this.where[columnName] = resolveValue(where[columnName])
    }
    this.updatePromise = this.createUpdatePromise(firer)
  }

  public addColumnData(columnName: string, value: ColumnValueLike)
  {
    this.rowData[columnName] = resolveValue(value)
  }

  public async updateRow()
  {
    return this.updatePromise
  }

  private async createUpdatePromise(firer: PromiseLike<void>)
  {
    await firer
    const qb = this.db(this.tableName)

    qb.where(await promiseAllObject(this.where))

    let affectedRows = 0

    const rowData = await promiseAllObject(this.rowData)
    const rowDataFiltered = Object.keys(rowData)
      .filter(key => rowData[key] !== undefined)
      .reduce((result: object, key: string) => ({...result, [key]: rowData[key]}), {})

    if (Object.keys(rowDataFiltered).length > 0) {
      affectedRows = await qb.update(rowDataFiltered)
    }

    return affectedRows
  }
}

export class Mapper
{
  private schema: Schema
  private db: Knex

  constructor(schema: Schema, db: Knex)
  {
    this.schema = schema
    this.db = db
  }

  public async selectField(entityName: string, where: UniqueWhere, fieldName: string)
  {
    const entity = getEntity(this.schema, entityName)
    const columnName = getColumnName(this.schema, entity, fieldName)

    const result = await this.db.table(entity.name).select(columnName).where(this.getUniqueWhereArgs(entity, where))

    return result[0] !== undefined ? result[0][columnName] : undefined
  }

  public async insert(entityName: string, data: CreateDataInput): Promise<PrimaryValue>
  {
    const entity = getEntity(this.schema, entityName)

    let resolver: (() => any) = () => {
      throw new Error()
    }
    const insertBuilder = new InsertBuilder(entity.tableName, entity.primaryColumn, this.db, new Promise(resolve => resolver = resolve))
    const promises = acceptEveryFieldVisitor(this.schema, entity, new InsertVisitor(data, insertBuilder, this))
    resolver()

    const result = await insertBuilder.insertRow()

    await Promise.all(Object.values(promises).filter(it => !!it))

    return result
  }

  public async update(entityName: string, where: UniqueWhere, data: UpdateDataInput): Promise<number>
  {
    const entity = getEntity(this.schema, entityName)

    const primaryValue = await this.getPrimaryValue(entity, where)
    if (primaryValue === undefined) {
      return Promise.resolve(0)
    }
    let resolver: (() => any) = () => {
      throw new Error()
    }
    const updateBuilder = new UpdateBuilder(entity.tableName, this.getUniqueWhereArgs(entity, where), this.db, new Promise(resolve => resolver = resolve))
    const promises = acceptEveryFieldVisitor(this.schema, entity, new UpdateVisitor(primaryValue, data, updateBuilder, this))
    resolver()

    await Promise.all(Object.values(promises).filter(it => !!it))

    return await updateBuilder.updateRow()
  }

  public async delete(entityName: string, where: UniqueWhere): Promise<number>
  {
    const entity = getEntity(this.schema, entityName)
    return await this.db(entity.tableName).where(this.getUniqueWhereArgs(entity, where)).delete()
  }

  public async connectJunction(owningEntity: Entity, relation: ManyHasManyOwnerRelation, ownerUnique: UniqueWhere, inversedUnique: UniqueWhere)
  {
    const joiningTable = relation.joiningTable
    const primaryValue = await this.getPrimaryValue(owningEntity, ownerUnique)
    const inversedPrimaryValue = await this.getPrimaryValue(getEntity(this.schema, relation.target), inversedUnique)

    const insert = this.db.table(joiningTable.tableName)
      .insert({
        [joiningTable.joiningColumn.columnName]: primaryValue,
        [joiningTable.inverseJoiningColumn.columnName]: inversedPrimaryValue,
      })

    await this.db.raw(insert.toString() + ' on conflict do nothing')
  }

  public async disconnectJunction(owningEntity: Entity, relation: ManyHasManyOwnerRelation, ownerUnique: UniqueWhere, inversedUnique: UniqueWhere)
  {
    const joiningTable = relation.joiningTable
    await this.db.table(joiningTable.tableName)
      .where({
        [joiningTable.joiningColumn.columnName]: await this.getPrimaryValue(owningEntity, ownerUnique),
        [joiningTable.inverseJoiningColumn.columnName]: await this.getPrimaryValue(getEntity(this.schema, relation.target), inversedUnique),
      })
      .delete()
  }

  public async getPrimaryValue(entity: Entity, where: UniqueWhere)
  {
    if (where[entity.primary] !== undefined) {
      return where[entity.primary]
    }

    const whereArgs = this.getUniqueWhereArgs(entity, where)
    const result = await this.db.table(entity.name).select(entity.primaryColumn).where(whereArgs)

    return result[0] !== undefined ? result[0][entity.primaryColumn] : undefined
  }

  public getUniqueWhereArgs(entity: Entity, where: UniqueWhere): { [columnName: string]: ColumnValue }
  {
    if (!isUniqueWhere(entity, where)) {
      throw new Error("Unique where is not unique")
    }
    const whereArgs: { [columnName: string]: ColumnValue } = {}
    for (const field in where) {
      whereArgs[getColumnName(this.schema, entity, field)] = where[field]
    }

    return whereArgs
  }
}

const insertData = (schema: Schema, db: Knex) => (entityName: string, data: CreateDataInput): PromiseLike<PrimaryValue> => {
  return db.transaction(trx => {
    const mapper = new Mapper(schema, trx)
    return mapper.insert(entityName, data)
  })
}

const updateData = (schema: Schema, db: Knex) => (entityName: string, where: UniqueWhere, data: UpdateDataInput): PromiseLike<number> => {
  return db.transaction(trx => {
    const mapper = new Mapper(schema, trx)
    return mapper.update(entityName, where, data)
  })
}

const deleteData = (schema: Schema, db: Knex) => (entityName: string, where: UniqueWhere): PromiseLike<number> => {
  return db.transaction(trx => {
    const mapper = new Mapper(schema, trx)
    return mapper.delete(entityName, where)
  })
}

export { insertData, updateData, deleteData }
