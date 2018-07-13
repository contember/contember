import * as uuidv4 from "uuid/v4"
import {
  ConnectRelationInput,
  CreateDataInput,
  CreateManyRelationInput,
  CreateOneRelationInput,
  CreateRelationInput,
  PrimaryValue,
  UniqueWhere
} from "../schema/input"
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
} from "../schema/model"
import { isIt } from "../utils/type"
import { InsertBuilder, Mapper } from "./mapper"

interface RelationInputProcessor
{
  connect(input: UniqueWhere): PromiseLike<void>

  create(input: CreateDataInput): PromiseLike<void>
}

export default class InsertVisitor implements ColumnVisitor<void>, RelationByTypeVisitor<PromiseLike<any>>
{
  private data: CreateDataInput
  private insertBuilder: InsertBuilder
  private mapper: Mapper

  constructor(data: CreateDataInput, insertBuilder: InsertBuilder, mapper: Mapper)
  {
    this.data = data
    this.insertBuilder = insertBuilder
    this.mapper = mapper
  }

  public visitColumn(entity: Entity, column: Column): void
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
    })())
  }

  public visitManyHasManyInversed(entity: Entity, relation: ManyHasManyInversedRelation, targetEntity: Entity, targetRelation: ManyHasManyOwnerRelation)
  {
    const insertBuilder = this.insertBuilder
    const mapper = this.mapper

    return this.processManyRelationInput(this.data[relation.name] as CreateManyRelationInput, new class implements RelationInputProcessor
    {
      public async connect(input: UniqueWhere)
      {
        const primaryInversed = await insertBuilder.insertRow()
        await mapper.connectJunction(targetEntity, targetRelation, {[targetEntity.primary]: input[targetEntity.primary]}, {[entity.primary]: primaryInversed})
      }

      public async create(input: CreateDataInput)
      {
        const primaryInversed = await insertBuilder.insertRow()
        const primaryOwner = await mapper.insert(targetEntity.name, input)
        await mapper.connectJunction(targetEntity, targetRelation, {[targetEntity.primary]: primaryOwner}, {[entity.primary]: primaryInversed})
      }
    })
  }

  public visitManyHasManyOwner(entity: Entity, relation: ManyHasManyOwnerRelation, targetEntity: Entity, targetRelation: ManyHasManyInversedRelation | null)
  {
    const insertBuilder = this.insertBuilder
    const mapper = this.mapper

    return this.processManyRelationInput(this.data[relation.name] as CreateManyRelationInput, new class implements RelationInputProcessor
    {
      public async connect(input: UniqueWhere)
      {
        const primary = await insertBuilder.insertRow()
        await mapper.connectJunction(entity, relation, {[entity.primary]: primary}, {[targetEntity.primary]: input[targetEntity.primary]})
      }

      public async create(input: CreateDataInput)
      {
        const primary = await insertBuilder.insertRow()
        const primaryInversed = await mapper.insert(targetEntity.name, input)
        await mapper.connectJunction(entity, relation, {[entity.primary]: primary}, {[targetEntity.primary]: primaryInversed})
      }
    })
  }

  public visitManyHasOne(entity: Entity, relation: ManyHasOneRelation, targetEntity: Entity, targetRelation: OneHasManyRelation | null)
  {
    const insertBuilder = this.insertBuilder
    const mapper = this.mapper

    return this.processRelationInput(this.data[relation.name] as CreateOneRelationInput, new class implements RelationInputProcessor
    {
      public async connect(input: UniqueWhere)
      {
        insertBuilder.addColumnData(relation.joiningColumn.columnName, input[targetEntity.primary])
      }

      public async create(input: CreateDataInput)
      {
        insertBuilder.addColumnData(relation.joiningColumn.columnName, mapper.insert(targetEntity.name, input))
      }
    })
  }

  public visitOneHasMany(entity: Entity, relation: OneHasManyRelation, targetEntity: Entity, targetRelation: ManyHasOneRelation)
  {
    const insertBuilder = this.insertBuilder
    const mapper = this.mapper

    return this.processManyRelationInput(this.data[relation.name] as CreateManyRelationInput, new class implements RelationInputProcessor
    {
      public async connect(input: UniqueWhere)
      {
        const value = await insertBuilder.insertRow()
        await mapper.update(targetEntity.name, input, {
          [targetRelation.name]: {
            connect: {[relation.name]: value}
          }
        })
      }

      public async create(input: CreateDataInput)
      {
        const primary = await insertBuilder.insertRow()
        await mapper.insert(targetEntity.name, {
          ...input,
          [targetRelation.name]: {
            connect: {[entity.primary]: primary}
          }
        })
      }
    })
  }

  public visitOneHasOneInversed(entity: Entity, relation: OneHasOneInversedRelation, targetEntity: Entity, targetRelation: OneHasOneOwnerRelation)
  {
    const insertBuilder = this.insertBuilder
    const mapper = this.mapper

    return this.processRelationInput(this.data[relation.name] as CreateOneRelationInput, new class implements RelationInputProcessor
    {
      public async connect(input: UniqueWhere)
      {
        const value = await insertBuilder.insertRow()
        await mapper.update(targetEntity.name, input, {
          [targetRelation.name]: {
            connect: {[entity.primary]: value}
          }
        })
      }

      public async create(input: CreateDataInput)
      {
        const primary = await insertBuilder.insertRow()
        await mapper.insert(targetEntity.name, {
          ...input,
          [targetRelation.name]: {
            connect: {[entity.primary]: primary}
          }
        })
      }
    })
  }

  public visitOneHasOneOwner(entity: Entity, relation: OneHasOneOwnerRelation, targetEntity: Entity, targetRelation: OneHasOneInversedRelation | null)
  {
    const insertBuilder = this.insertBuilder
    const mapper = this.mapper

    return this.processRelationInput(this.data[relation.name] as CreateOneRelationInput, new class implements RelationInputProcessor
    {
      public async connect(input: UniqueWhere)
      {
        insertBuilder.addColumnData(relation.joiningColumn.columnName, input[targetEntity.primary])
      }

      public async create(input: CreateDataInput)
      {
        insertBuilder.addColumnData(relation.joiningColumn.columnName, mapper.insert(targetEntity.name, input))
      }
    })
  }

  private processRelationInput(input: CreateOneRelationInput | undefined, processor: RelationInputProcessor): PromiseLike<any>
  {
    if (input === undefined) {
      return Promise.resolve(undefined)
    }
    const relations = []
    let result: PromiseLike<void> | null = null
    if (isIt<ConnectRelationInput>(input, "connect")) {
      relations.push("connect")
      result = processor.connect(input.connect)
    }
    if (isIt<CreateRelationInput>(input, "create")) {
      relations.push("create")
      result = processor.create(input.create)
    }

    if (relations.length !== 1) {
      const found = relations.length === 0 ? "none" : "both"
      throw new Error(`Expected either "create" or "connect", ${found} found.`)
    }
    if (result === null) {
      throw new Error()
    }
    return result
  }

  private processManyRelationInput(input: CreateManyRelationInput | undefined, processor: RelationInputProcessor): PromiseLike<any>
  {
    if (input === undefined) {
      return Promise.resolve(undefined)
    }
    const promises = []
    for (const element of input) {
      const result = this.processRelationInput(element, processor)
      promises.push(result)
    }
    return Promise.all(promises)
  }

  private resolvePrimaryGenerator(column: Column): () => PrimaryValue
  {
    if (column.type === "uuid") {
      return uuidv4
    }
    throw new Error("not implemented")
  }
}
