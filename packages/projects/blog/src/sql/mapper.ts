import { Entity, JoiningColumnRelation, ManyHasManyOwnerRelation, Schema } from "../schema/model";
import * as Knex from 'knex';
import { promiseAllObject } from "../utils/promises";
import { ColumnValue, ColumnValueLike, CreateInput, PrimaryValue, UniqueWhere, UpdateInput } from "../schema/input";
import { resolveValue } from "./utils";
import InsertVisitor from "./insertVisitor";
import UpdateVisitor from "./updateVisitor";
import { isIt } from "../utils/type";
import { acceptEveryFieldVisitor, acceptFieldVisitor, getEntity } from "../schema/modelUtils";


type OnAfterInsertCallback = ((id: PrimaryValue) => PromiseLike<any>)
type OnAfterUpdateCallback = (() => PromiseLike<any>)


export class InsertBuilder
{
  private rowData: { [columnName: string]: PromiseLike<ColumnValue> } = {}
  private afterInsert: OnAfterInsertCallback[] = []

  private tableName: string;
  private primaryColumn: string;
  private db: Knex;

  constructor(tableName: string, primaryColumn: string, db: Knex)
  {
    this.tableName = tableName;
    this.primaryColumn = primaryColumn;
    this.db = db;

  }

  addColumnData(columnName: string, value: ColumnValueLike)
  {
    this.rowData[columnName] = resolveValue(value)
  }

  onAfterInsert(callback: OnAfterInsertCallback)
  {
    this.afterInsert.push(callback)
  }

  async insertRow(): Promise<PrimaryValue>
  {
    const qb = this.db.queryBuilder().table(this.tableName)
    const rowData = await promiseAllObject(this.rowData)
    const returning = await qb.insert(rowData, this.primaryColumn)
    await Promise.all(this.afterInsert.map(callback => callback(returning[0])))

    return returning[0]
  }
}


export class UpdateBuilder
{
  private rowData: { [columnName: string]: PromiseLike<ColumnValue> } = {}
  private afterUpdate: OnAfterUpdateCallback[] = []
  private beforeUpdate: PromiseLike<any>[] = []

  private tableName: string
  private db: Knex
  private where: { [columnName: string]: PromiseLike<ColumnValue> } = {}

  constructor(tableName: string, where: { [columnName: string]: ColumnValueLike }, db: Knex)
  {
    this.tableName = tableName;
    this.db = db
    for (let columnName in where) {
      this.where[columnName] = resolveValue(where[columnName])
    }
  }

  addColumnData(columnName: string, value: ColumnValueLike)
  {
    this.rowData[columnName] = resolveValue(value)
  }

  onAfterUpdate(callback: OnAfterUpdateCallback)
  {
    this.afterUpdate.push(callback)
  }

  onBeforeUpdate(promise: PromiseLike<any>)
  {
    this.beforeUpdate.push(promise)
  }

  async updateRow()
  {
    await Promise.all(this.beforeUpdate)

    const qb = this.db.queryBuilder().table(this.tableName)

    qb.where(await promiseAllObject(this.where))

    let affectedRows = 0

    if (Object.keys(this.rowData).length > 0) {
      affectedRows = await qb.update(await promiseAllObject(this.rowData))
    }

    await Promise.all(this.afterUpdate.map(callback => callback()))
    return affectedRows
  }
}

export class Mapper
{
  private schema: Schema;
  private db: Knex;

  constructor(schema: Schema, db: Knex)
  {
    this.schema = schema;
    this.db = db;
  }


  async selectField(entityName: string, where: UniqueWhere, fieldName: string)
  {
    const entity = getEntity(this.schema, entityName)
    const columnName = this.getColumnName(entity, fieldName)

    const result = await this.db.table(entity.name).select(columnName).where(entity.primaryColumn, await this.getPrimaryValue(entity, where))

    return result[0] !== undefined ? result[0][columnName] : undefined
  }

  async insert(entityName: string, data: CreateInput): Promise<PrimaryValue>
  {
    const entity = getEntity(this.schema, entityName)

    const insertBuilder = new InsertBuilder(entity.tableName, entity.primaryColumn, this.db)
    acceptEveryFieldVisitor(this.schema, entity, new InsertVisitor(data, insertBuilder, this, this.db))

    return await insertBuilder.insertRow()
  }

  async update(entityName: string, where: UniqueWhere, data: UpdateInput): Promise<number>
  {
    const entity = getEntity(this.schema, entityName)

    const primaryValue = await this.getPrimaryValue(entity, where);
    const updateBuilder = new UpdateBuilder(entity.tableName, {[entity.primary]: primaryValue}, this.db)
    if (primaryValue === undefined) {
      return Promise.resolve(0)
    }
    acceptEveryFieldVisitor(this.schema, entity, new UpdateVisitor(primaryValue, data, updateBuilder, this, this.db))

    return await updateBuilder.updateRow()
  }

  async delete(entityName: string, where: UniqueWhere): Promise<number>
  {
    const entity = getEntity(this.schema, entityName)
    const primaryValue = await this.getPrimaryValue(entity, where);
    if (primaryValue === undefined) {
      return Promise.resolve(0)
    }
    return await this.db.where(entity.primaryColumn, {[entity.primaryColumn]: primaryValue}).delete()
  }

  async connectJunction(owningEntity: Entity, relation: ManyHasManyOwnerRelation, ownerUnique: UniqueWhere, inversedUnique: UniqueWhere)
  {
    const joiningTable = relation.joiningTable
    const primaryValue = await this.getPrimaryValue(owningEntity, ownerUnique);
    const inversedPrimaryValue = await this.getPrimaryValue(getEntity(this.schema, relation.target), inversedUnique);
    const subquery = this.db.table(joiningTable.tableName)
      .where({
        [joiningTable.joiningColumn.columnName]: primaryValue,
        [joiningTable.inverseJoiningColumn.columnName]: inversedPrimaryValue,
      })
      .select('?', '1')

    await this.db.table(joiningTable.tableName)
      .whereNotExists(subquery)
      .insert({
        [joiningTable.joiningColumn.columnName]: primaryValue,
        [joiningTable.inverseJoiningColumn.columnName]: inversedPrimaryValue,
      })
  }

  async disconnectJunction(owningEntity: Entity, relation: ManyHasManyOwnerRelation, ownerUnique: UniqueWhere, inversedUnique: UniqueWhere)
  {
    const joiningTable = relation.joiningTable
    await this.db.table(joiningTable.tableName)
      .where({
        [joiningTable.joiningColumn.columnName]: await this.getPrimaryValue(owningEntity, ownerUnique),
        [joiningTable.inverseJoiningColumn.columnName]: await this.getPrimaryValue(getEntity(this.schema, relation.target), inversedUnique),
      })
      .delete()
  }

  async getPrimaryValue(entity: Entity, where: UniqueWhere)
  {
    if (where[entity.primary] !== undefined) {
      return where[entity.primary]
    }

    const whereArgs: { [columnName: string]: ColumnValue } = {}
    //todo check that it is unique
    for (let field in where) {
      whereArgs[this.getColumnName(entity, field)] = where[field]
    }

    const result = await this.db.table(entity.name).select(entity.primaryColumn).where(whereArgs)

    return result[0] !== undefined ? result[0][entity.primaryColumn] : undefined
  }

  private getColumnName(entity: Entity, fieldName: string)
  {
    return acceptFieldVisitor(this.schema, entity, fieldName, {
      visitColumn: (entity, column) => column.name,
      visitRelation: (entity, relation) => {
        if (isIt<JoiningColumnRelation>(relation, 'joiningColumn')) {
          return relation.joiningColumn.columnName
        }
        throw new Error('Not an owning side')
      }
    })
  }
}

const insertData = (schema: Schema, db: Knex) => (entityName: string, data: CreateInput) => {
  return db.transaction(trx => {
    const mapper = new Mapper(schema, trx)
    return mapper.insert(entityName, data)
  })
}

const updateData = (schema: Schema, db: Knex) => (entityName: string, where: UniqueWhere, data: UpdateInput) => {
  return db.transaction(trx => {
    const mapper = new Mapper(schema, trx)
    return mapper.update(entityName, where, data)
  })
}

export {insertData, updateData};
