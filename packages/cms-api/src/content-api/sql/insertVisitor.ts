import { Input, Model } from "cms-common"
import { isIt } from "../../utils/type"
import { InsertBuilder, Mapper } from "./mapper"
import { uuid } from "../../utils/uuid";

interface RelationInputProcessor
{
  connect(input: Input.UniqueWhere): PromiseLike<void>

  create(input: Input.CreateDataInput): PromiseLike<void>
}

export default class InsertVisitor implements Model.ColumnVisitor<void>, Model.RelationByTypeVisitor<PromiseLike<any>>
{
  private data: Input.CreateDataInput
  private insertBuilder: InsertBuilder
  private mapper: Mapper

  constructor(data: Input.CreateDataInput, insertBuilder: InsertBuilder, mapper: Mapper)
  {
    this.data = data
    this.insertBuilder = insertBuilder
    this.mapper = mapper
  }

  public visitColumn(entity: Model.Entity, column: Model.AnyColumn): void
  {
    this.insertBuilder.addColumnData(column.columnName, (() => {
      if (this.data[column.name] !== undefined) {
        return this.data[column.name] as Input.ColumnValueLike // TODO: find out why this.data may contain wrong types
      }

      switch (column.type) {
        case Model.ColumnType.String:
        case Model.ColumnType.Int:
        case Model.ColumnType.Enum:
        case Model.ColumnType.Double:
        case Model.ColumnType.Bool:
          if (typeof column.default !== "undefined" ) {
            return column.default
          }
          break
        case Model.ColumnType.DateTime:
        case Model.ColumnType.Date:
          if (column.default === "now") {
            return new Date().toISOString()
          }
          break
        case Model.ColumnType.Uuid:
          break
        default:
          ((x: never) => {})(column)
      }

      if (entity.primary === column.name) {
        return this.resolvePrimaryGenerator(column)()
      }

      throw new Error("NoData")
    })())
  }

  public visitManyHasManyInversed(entity: Model.Entity, relation: Model.ManyHasManyInversedRelation, targetEntity: Model.Entity, targetRelation: Model.ManyHasManyOwnerRelation)
  {
    const insertBuilder = this.insertBuilder
    const mapper = this.mapper

    return this.processManyRelationInput(this.data[relation.name] as Input.CreateManyRelationInput, new class implements RelationInputProcessor
    {
      public async connect(input: Input.UniqueWhere)
      {
        const primaryInversed = await insertBuilder.insertRow()
        await mapper.connectJunction(targetEntity, targetRelation, {[targetEntity.primary]: input[targetEntity.primary]}, {[entity.primary]: primaryInversed})
      }

      public async create(input: Input.CreateDataInput)
      {
        const primaryInversed = await insertBuilder.insertRow()
        const primaryOwner = await mapper.insert(targetEntity.name, input)
        await mapper.connectJunction(targetEntity, targetRelation, {[targetEntity.primary]: primaryOwner}, {[entity.primary]: primaryInversed})
      }
    })
  }

  public visitManyHasManyOwner(entity: Model.Entity, relation: Model.ManyHasManyOwnerRelation, targetEntity: Model.Entity, targetRelation: Model.ManyHasManyInversedRelation | null)
  {
    const insertBuilder = this.insertBuilder
    const mapper = this.mapper

    return this.processManyRelationInput(this.data[relation.name] as Input.CreateManyRelationInput, new class implements RelationInputProcessor
    {
      public async connect(input: Input.UniqueWhere)
      {
        const primary = await insertBuilder.insertRow()
        await mapper.connectJunction(entity, relation, {[entity.primary]: primary}, {[targetEntity.primary]: input[targetEntity.primary]})
      }

      public async create(input: Input.CreateDataInput)
      {
        const primary = await insertBuilder.insertRow()
        const primaryInversed = await mapper.insert(targetEntity.name, input)
        await mapper.connectJunction(entity, relation, {[entity.primary]: primary}, {[targetEntity.primary]: primaryInversed})
      }
    })
  }

  public visitManyHasOne(entity: Model.Entity, relation: Model.ManyHasOneRelation, targetEntity: Model.Entity, targetRelation: Model.OneHasManyRelation | null)
  {
    const insertBuilder = this.insertBuilder
    const mapper = this.mapper

    return this.processRelationInput(this.data[relation.name] as Input.CreateOneRelationInput, new class implements RelationInputProcessor
    {
      public async connect(input: Input.UniqueWhere)
      {
        insertBuilder.addColumnData(relation.joiningColumn.columnName, input[targetEntity.primary])
      }

      public async create(input: Input.CreateDataInput)
      {
        insertBuilder.addColumnData(relation.joiningColumn.columnName, mapper.insert(targetEntity.name, input))
      }
    })
  }

  public visitOneHasMany(entity: Model.Entity, relation: Model.OneHasManyRelation, targetEntity: Model.Entity, targetRelation: Model.ManyHasOneRelation)
  {
    const insertBuilder = this.insertBuilder
    const mapper = this.mapper

    return this.processManyRelationInput(this.data[relation.name] as Input.CreateManyRelationInput, new class implements RelationInputProcessor
    {
      public async connect(input: Input.UniqueWhere)
      {
        const value = await insertBuilder.insertRow()
        await mapper.update(targetEntity.name, input, {
          [targetRelation.name]: {
            connect: {[relation.name]: value}
          }
        })
      }

      public async create(input: Input.CreateDataInput)
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

  public visitOneHasOneInversed(entity: Model.Entity, relation: Model.OneHasOneInversedRelation, targetEntity: Model.Entity, targetRelation: Model.OneHasOneOwnerRelation)
  {
    const insertBuilder = this.insertBuilder
    const mapper = this.mapper

    return this.processRelationInput(this.data[relation.name] as Input.CreateOneRelationInput, new class implements RelationInputProcessor
    {
      public async connect(input: Input.UniqueWhere)
      {
        const value = await insertBuilder.insertRow()
        await mapper.update(targetEntity.name, input, {
          [targetRelation.name]: {
            connect: {[entity.primary]: value}
          }
        })
      }

      public async create(input: Input.CreateDataInput)
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

  public visitOneHasOneOwner(entity: Model.Entity, relation: Model.OneHasOneOwnerRelation, targetEntity: Model.Entity, targetRelation: Model.OneHasOneInversedRelation | null)
  {
    const insertBuilder = this.insertBuilder
    const mapper = this.mapper

    return this.processRelationInput(this.data[relation.name] as Input.CreateOneRelationInput, new class implements RelationInputProcessor
    {
      public async connect(input: Input.UniqueWhere)
      {
        insertBuilder.addColumnData(relation.joiningColumn.columnName, input[targetEntity.primary])
      }

      public async create(input: Input.CreateDataInput)
      {
        insertBuilder.addColumnData(relation.joiningColumn.columnName, mapper.insert(targetEntity.name, input))
      }
    })
  }

  private processRelationInput(input: Input.CreateOneRelationInput | undefined, processor: RelationInputProcessor): PromiseLike<any>
  {
    if (input === undefined) {
      return Promise.resolve(undefined)
    }
    const relations = []
    let result: PromiseLike<void> | null = null
    if (isIt<Input.ConnectRelationInput>(input, "connect")) {
      relations.push("connect")
      result = processor.connect(input.connect)
    }
    if (isIt<Input.CreateRelationInput>(input, "create")) {
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

  private processManyRelationInput(input: Input.CreateManyRelationInput | undefined, processor: RelationInputProcessor): PromiseLike<any>
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

  private resolvePrimaryGenerator(column: Model.AnyColumn): () => Input.PrimaryValue
  {
    if (column.type === Model.ColumnType.Uuid) {
      return uuid
    }
    throw new Error("not implemented")
  }
}
