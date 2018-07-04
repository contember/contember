import { acceptEveryFieldVisitor, acceptFieldVisitor, getEntity, Schema } from "../model";
import * as Knex from 'knex';
import { promiseAllObject } from "../utils/promises";
import { ColumnValue, ColumnValueLike, CreateInput, PrimaryValue } from "./types";
import { resolveValue } from "./utils";
import InsertVisitor from "./insertVisitor";


type OnAfterInsertCallback = ((id: PrimaryValue) => PromiseLike<any>)


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

  insertRow(): Promise<PrimaryValue>
  {
    const qb = this.db.queryBuilder().table(this.tableName)
    return promiseAllObject(this.rowData)
      .then(rowData => qb.insert(rowData, this.primaryColumn))
      .then(returning => returning[0])
      .then(primary => {
        return Promise.all(this.afterInsert.map(callback => callback(primary)))
          .then(() => primary)
      })
  }
}

export class RowInserter
{
  private schema: Schema;
  private db: Knex;

  constructor(schema: Schema, db: Knex)
  {
    this.schema = schema;
    this.db = db;
  }

  insert(entityName: string, data: CreateInput): Promise<PrimaryValue>
  {
    const entity = getEntity(this.schema, entityName)
    const primaryColumn = acceptFieldVisitor(this.schema, entity, entity.primary, {
      visitColumn: (entity, column) => column.columnName,
      visitRelation: () => {
        throw new Error()
      }
    })

    const insertBuilder = new InsertBuilder(entity.tableName, primaryColumn, this.db)
    acceptEveryFieldVisitor(this.schema, entity, new InsertVisitor(data, insertBuilder, this, this.db))

    return insertBuilder.insertRow()
  }
}

const insertRow = (schema: Schema, db: Knex) => (entityName: string, data: any) => {
  return db.transaction(trx => {
    const inserter = new RowInserter(schema, trx)
    return inserter.insert(entityName, data)
  })
}

export default insertRow;
