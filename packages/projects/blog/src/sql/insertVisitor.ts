import {
  Column,
  ColumnVisitor,
  Entity,
  ManyHasManyInversedRelation,
  ManyHasManyOwnerRelation,
  ManyHasOneRelation,
  OneHasManyRelation,
  OneHasOneInversedRelation,
  OneHasOneOwnerRelation,
  RelationByTypeVisitor
} from "../model";
import * as Knex from 'knex';
import * as uuidv4 from 'uuid/v4'
import {
  ColumnValueLike,
  CreateInput,
  CreateManyRelationInput,
  CreateOneRelationInput,
  isConnectRelationInput,
  isCreateRelationInput,
  PrimaryValue,
  PrimaryValueLike,
  RelationConnectionInput
} from "./types";
import { InsertBuilder, RowInserter } from "./mapper";


interface RelationInputProcessor
{
  connect(input: RelationConnectionInput): void;

  create(input: CreateInput): void;
}


export default class InsertVisitor implements ColumnVisitor<void>, RelationByTypeVisitor<void>
{
  private data: CreateInput;
  private insertBuilder: InsertBuilder;
  private inserter: RowInserter;
  private db: Knex;

  constructor(data: CreateInput, insertBuilder: InsertBuilder, inserter: RowInserter, db: Knex)
  {
    this.data = data;
    this.insertBuilder = insertBuilder;
    this.inserter = inserter;
    this.db = db;
  }

  visitColumn(entity: Entity, column: Column): void
  {
    this.insertBuilder.addColumnData(column.columnName, (() => {
      if (this.data[column.name] !== undefined) {
        return this.data[column.name]
      }
      if (column.default) {
        if (typeof column.default === "function") {
          return column.default()
        }
        return column.default
      }
      if (entity.primary === column.name) {
        return this.resolvePrimaryGenerator(column)()
      }
    })());
  }

  visitManyHasManyInversed(entity: Entity, relation: ManyHasManyInversedRelation, targetEntity: Entity, targetRelation: ManyHasManyOwnerRelation): void
  {
    const relationData = this.data[relation.name] as CreateManyRelationInput
    if (relationData === undefined) {
      return
    }

    const connect = (primary: PrimaryValue) =>
      this.insertBuilder.onAfterInsert(primaryInversed =>
        this.joinManyHasMany(targetRelation, primary, primaryInversed)
      )

    const createAndConnect = (input: CreateInput) =>
      this.insertBuilder.onAfterInsert(async (primaryInversed) => {
          const primaryOwner = await this.inserter.insert(targetEntity.name, input)
          return await this.joinManyHasMany(targetRelation, primaryOwner, primaryInversed)
        }
      )

    for (let element of relationData) {
      this.processRelationInput(element, new class implements RelationInputProcessor
      {
        connect(input: RelationConnectionInput): void
        {
          connect(input[targetEntity.primary])
        }

        create(input: CreateInput): void
        {
          createAndConnect(input)
        }
      })
    }
  }

  visitManyHasManyOwner(entity: Entity, relation: ManyHasManyOwnerRelation, targetEntity: Entity, targetRelation: ManyHasManyInversedRelation | null): void
  {
    const relationData = this.data[relation.name] as CreateManyRelationInput
    if (relationData === undefined) {
      return
    }

    const connect = (value: PrimaryValue) =>
      this.insertBuilder.onAfterInsert(primary =>
        this.joinManyHasMany(relation, primary, value)
      )

    const createAndConnect = (input: CreateInput) =>
      this.insertBuilder.onAfterInsert(async (primary) => {
          const primaryInversed = await this.inserter.insert(targetEntity.name, input)
          return await this.joinManyHasMany(relation, primary, primaryInversed)
        }
      )

    for (let relationInput of relationData) {
      this.processRelationInput(relationInput, new class implements RelationInputProcessor
      {
        connect(input: RelationConnectionInput): void
        {
          connect(input[targetEntity.primary])
        }

        create(input: CreateInput): void
        {
          createAndConnect(input)
        }
      })
    }
  }


  visitManyHasOne(entity: Entity, relation: ManyHasOneRelation, targetEntity: Entity, targetRelation: OneHasManyRelation | null): void
  {
    const relationData = this.data[relation.name];
    if (relationData === undefined) {
      return
    }
    const addColumnData = (value: PrimaryValueLike) =>
      this.insertBuilder.addColumnData(relation.joiningColumn.columnName, value)

    const createRelation = (input: CreateInput) =>
      this.inserter.insert(targetEntity.name, input)

    this.processRelationInput(this.data[relation.name] as CreateOneRelationInput, new class implements RelationInputProcessor
    {
      connect(input: RelationConnectionInput): void
      {
        addColumnData(input[targetEntity.primary])
      }

      create(input: CreateInput): void
      {
        addColumnData(createRelation((input)))
      }
    })
  }

  visitOneHasMany(entity: Entity, relation: OneHasManyRelation, targetEntity: Entity, targetRelation: ManyHasOneRelation): void
  {
    const relationData = this.data[relation.name] as CreateManyRelationInput;
    if (relationData === undefined) {
      return
    }
    const updateOwner = this.updateHasOneOwner(targetEntity, targetRelation)
    const insertOwner = this.createHasOneOwner(targetEntity, targetRelation)

    for (let relationInput of relationData) {
      this.processRelationInput(relationInput, new class implements RelationInputProcessor
      {
        connect(input: RelationConnectionInput): void
        {
          updateOwner(input[targetEntity.primary])
        }

        create(input: CreateInput): void
        {
          insertOwner(input)
        }
      })
    }
  }

  visitOneHasOneInversed(entity: Entity, relation: OneHasOneInversedRelation, targetEntity: Entity, targetRelation: OneHasOneOwnerRelation): void
  {
    const updateOwner = this.updateHasOneOwner(targetEntity, targetRelation)
    const insertOwner = this.createHasOneOwner(targetEntity, targetRelation)

    this.processRelationInput(this.data[relation.name] as CreateOneRelationInput, new class implements RelationInputProcessor
    {
      connect(input: RelationConnectionInput): void
      {
        updateOwner(input[targetEntity.primary])
      }

      create(input: CreateInput): void
      {
        insertOwner(input)
      }
    })
  }


  visitOneHasOneOwner(entity: Entity, relation: OneHasOneOwnerRelation, targetEntity: Entity, targetRelation: OneHasOneInversedRelation | null): void
  {
    const addColumnData = (data: ColumnValueLike) =>
      this.insertBuilder.addColumnData(relation.joiningColumn.columnName, data)

    const createRelation = (data: CreateInput) =>
      this.inserter.insert(targetEntity.name, data)

    this.processRelationInput(this.data[relation.name] as CreateOneRelationInput, new class implements RelationInputProcessor
    {
      connect(input: RelationConnectionInput): void
      {
        addColumnData(input[targetEntity.primary])
      }

      create(input: CreateInput): void
      {
        addColumnData(createRelation(input))
      }
    })
  }


  private joinManyHasMany(relation: ManyHasManyOwnerRelation, value: PrimaryValue, inversedValue: PrimaryValue)
  {
    const joiningTable = relation.joiningTable
    return this.db.table(joiningTable.tableName)
      .insert({
        [joiningTable.joiningColumn.columnName]: value,
        [joiningTable.inverseJoiningColumn.columnName]: inversedValue,
      })
  }

  private updateHasOneOwner(entity: Entity, relation: OneHasOneOwnerRelation | ManyHasOneRelation)
  {
    return (primary: PrimaryValue) =>
      this.insertBuilder.onAfterInsert(value =>
        this.db.table(entity.tableName)
          .update(relation.joiningColumn.columnName, value)
          .where(entity.primary, primary)
      )
  }

  private createHasOneOwner(entity: Entity, relation: OneHasOneOwnerRelation | ManyHasOneRelation)
  {
    return (data: CreateInput) =>
      this.insertBuilder.onAfterInsert(primary =>
        this.inserter.insert(entity.name, {
          ...data,
          [relation.name]: {connect: {[entity.primary]: primary}}
        })
      )
  }

  private processRelationInput(input: CreateOneRelationInput | undefined, processor: RelationInputProcessor)
  {
    if (input === undefined) {
      return
    }
    const relations = []
    if (isConnectRelationInput(input)) {
      relations.push('connect')
      processor.connect(input.connect)
    }
    if (isCreateRelationInput(input)) {
      relations.push('create')
      processor.create(input.create)
    }

    if (relations.length !== 1) {
      const found = relations.length === 0 ? "none" : "both"
      throw new Error(`Expected either "create" or "connect", ${found} found.`)
    }
  }

  private resolvePrimaryGenerator(column: Column): () => PrimaryValue
  {
    if (column.type === "uuid") {
      return uuidv4
    }
    throw new Error('not implemented')
  }
}
