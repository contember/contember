import {
  ColumnValue,
  ConnectRelationInput,
  CreateDataInput,
  CreateManyRelationInput,
  CreateRelationInput,
  DeleteRelationInput,
  DeleteSpecifiedRelationInput,
  DisconnectRelationInput,
  DisconnectSpecifiedRelationInput,
  PrimaryValue,
  UniqueWhere,
  UpdateDataInput,
  UpdateManyRelationInput,
  UpdateOneRelationInput,
  UpdateRelationInput,
  UpdateSpecifiedRelationInput,
  UpsertRelationInput,
  UpsertSpecifiedRelationInput
} from "../../content-schema/input"
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
} from "../../content-schema/model"
import { isIt } from "../../utils/type"
import { Mapper, UpdateBuilder } from "./mapper"

interface HasOneRelationInputProcessor
{
  connect(input: UniqueWhere): PromiseLike<void>

  create(input: CreateDataInput): PromiseLike<void>

  update(input: UpdateDataInput): PromiseLike<void>

  upsert(update: UpdateDataInput, create: CreateDataInput): PromiseLike<void>

  disconnect(): PromiseLike<void>

  delete(): PromiseLike<void>
}

interface HasManyRelationInputProcessor
{
  connect(input: UniqueWhere): PromiseLike<void>

  create(input: CreateDataInput): PromiseLike<void>

  update(where: UniqueWhere, input: UpdateDataInput): PromiseLike<void>

  upsert(where: UniqueWhere, update: UpdateDataInput, create: CreateDataInput): PromiseLike<void>

  disconnect(where: UniqueWhere): PromiseLike<void>

  delete(where: UniqueWhere): PromiseLike<void>
}

export default class UpdateVisitor implements ColumnVisitor<void>, RelationByTypeVisitor<PromiseLike<any>>
{
  private primaryValue: PrimaryValue
  private data: UpdateDataInput
  private updateBuilder: UpdateBuilder
  private mapper: Mapper

  constructor(primaryValue: PrimaryValue, data: UpdateDataInput, updateBuilder: UpdateBuilder, mapper: Mapper)
  {
    this.primaryValue = primaryValue
    this.data = data
    this.updateBuilder = updateBuilder
    this.mapper = mapper
  }

  public visitColumn(entity: Entity, column: Column): void
  {
    if (this.data[column.name] !== undefined) {
      this.updateBuilder.addColumnData(column.columnName, this.data[column.name] as ColumnValue)
    }
  }

  public visitManyHasManyInversed(entity: Entity, relation: ManyHasManyInversedRelation, targetEntity: Entity, targetRelation: ManyHasManyOwnerRelation)
  {
    const relationData = this.data[relation.name] as CreateManyRelationInput
    if (relationData === undefined) {
      return Promise.resolve(undefined)
    }
    const thisUnique = {[entity.primary]: this.primaryValue}

    const mapper = this.mapper

    const connect = (primaryUnique: UniqueWhere) => mapper.connectJunction(targetEntity, targetRelation, primaryUnique, thisUnique)
    const disconnect = (primaryUnique: UniqueWhere) => mapper.disconnectJunction(targetEntity, targetRelation, primaryUnique, thisUnique)

    return this.processHasManyRelationInput(relationData, new class implements HasManyRelationInputProcessor
    {
      public async connect(input: UniqueWhere)
      {
        await connect(input)
      }

      public async create(input: CreateDataInput)
      {
        const primaryOwner = await mapper.insert(targetEntity.name, input)
        await connect({[targetEntity.primary]: primaryOwner})
      }

      public async delete(where: UniqueWhere)
      {
        await disconnect(where)
        await mapper.delete(targetEntity.name, where)
      }

      public async disconnect(where: UniqueWhere)
      {
        await disconnect(where)
      }

      public async update(where: UniqueWhere, input: UpdateDataInput)
      {
        // fixme should check if relation really exists
        await mapper.update(targetEntity.name, where, input)
        await connect(where)
      }

      public async upsert(where: UniqueWhere, update: UpdateDataInput, create: CreateDataInput)
      {
        // fixme should check if relation really exists
        const result = await mapper.update(targetEntity.name, where, update)
        if (result > 0) {
          // fixme it should already exist
          await connect(where)
        } else {
          const primaryValue = await mapper.insert(targetEntity.name, create)
          await connect({[targetEntity.primary]: primaryValue})
        }
      }
    })
  }

  public visitManyHasManyOwner(entity: Entity, relation: ManyHasManyOwnerRelation, targetEntity: Entity, targetRelation: ManyHasManyInversedRelation | null)
  {
    const relationData = this.data[relation.name] as UpdateManyRelationInput
    if (relationData === undefined) {
      return Promise.resolve(undefined)
    }
    const primaryUnique = {[entity.primary]: this.primaryValue}

    const mapper = this.mapper

    const connect = (inversedUnique: UniqueWhere) => mapper.connectJunction(entity, relation, primaryUnique, inversedUnique)
    const disconnect = (inversedUnique: UniqueWhere) => mapper.disconnectJunction(entity, relation, primaryUnique, inversedUnique)

    return this.processHasManyRelationInput(relationData, new class implements HasManyRelationInputProcessor
    {
      public async connect(input: UniqueWhere)
      {
        await connect(input)
      }

      public async create(input: CreateDataInput)
      {
        const primaryOwner = await mapper.insert(targetEntity.name, input)
        await connect({[targetEntity.primary]: primaryOwner})
      }

      public async delete(where: UniqueWhere)
      {
        await disconnect(where)
        await mapper.delete(targetEntity.name, where)
      }

      public async disconnect(where: UniqueWhere)
      {
        await disconnect(where)
      }

      public async update(where: UniqueWhere, input: UpdateDataInput)
      {
        // fixme should check if relation really exists
        await mapper.update(targetEntity.name, where, input)
        // fixme it should already exist
        await connect(where)
      }

      public async upsert(where: UniqueWhere, update: UpdateDataInput, create: CreateDataInput)
      {
        // fixme should check if relation really exists
        const result = await mapper.update(targetEntity.name, where, update)
        if (result > 0) {
          // fixme it should already exist
          await connect(where)
        } else {
          const primaryValue = await mapper.insert(targetEntity.name, create)
          await connect({[targetEntity.primary]: primaryValue})
        }
      }
    })
  }

  public visitManyHasOne(entity: Entity, relation: ManyHasOneRelation, targetEntity: Entity, targetRelation: OneHasManyRelation | null)
  {
    const relationData = this.data[relation.name] as UpdateOneRelationInput
    const updateBuilder = this.updateBuilder
    const mapper = this.mapper
    const primaryUnique = {[entity.primary]: this.primaryValue}

    return this.processHasOneRelationInput(relationData, new class implements HasOneRelationInputProcessor
    {
      public async connect(input: UniqueWhere)
      {
        updateBuilder.addColumnData(relation.joiningColumn.columnName, mapper.getPrimaryValue(targetEntity, input))
      }

      public async create(input: CreateDataInput)
      {
        updateBuilder.addColumnData(relation.joiningColumn.columnName, mapper.insert(targetEntity.name, input))
      }

      public async delete()
      {
        updateBuilder.addColumnData(relation.joiningColumn.columnName, null)
        const inversedPrimary = await mapper.selectField(entity.name, primaryUnique, relation.name)
        await updateBuilder.updateRow()
        await mapper.delete(targetEntity.name, {[targetEntity.primary]: inversedPrimary})
      }

      public async disconnect()
      {
        updateBuilder.addColumnData(relation.joiningColumn.columnName, null)
      }

      public async update(input: UpdateDataInput)
      {
        const inversedPrimary = await mapper.selectField(entity.name, primaryUnique, relation.name)
        await mapper.update(targetEntity.name, {[targetEntity.primary]: inversedPrimary}, input)
      }

      public async upsert(update: UpdateDataInput, create: CreateDataInput)
      {
        const select = mapper.selectField(entity.name, primaryUnique, relation.name)

        //addColumnData has to be called synchronously
        updateBuilder.addColumnData(relation.joiningColumn.columnName, async () => {
          const primary = await select
          if (primary) {
            return undefined
          }
          return mapper.insert(targetEntity.name, create)
        })

        const inversedPrimary = await select
        if (inversedPrimary) {
          await mapper.update(targetEntity.name, {[targetEntity.primary]: inversedPrimary}, update)
        }
      }
    })
  }

  public visitOneHasMany(entity: Entity, relation: OneHasManyRelation, targetEntity: Entity, targetRelation: ManyHasOneRelation)
  {
    const relationData = this.data[relation.name] as CreateManyRelationInput
    if (relationData === undefined) {
      return Promise.resolve(undefined)
    }
    const primaryValue = this.primaryValue
    const thisPrimary = {[entity.primary]: primaryValue}

    const mapper = this.mapper

    return this.processHasManyRelationInput(relationData, new class implements HasManyRelationInputProcessor
    {
      public async connect(input: UniqueWhere)
      {
        await mapper.update(targetEntity.name, input, {
          [targetRelation.name]: {connect: thisPrimary}
        })
      }

      public async create(input: CreateDataInput)
      {
        await mapper.insert(targetEntity.name, {
          ...input,
          [targetRelation.name]: {connect: thisPrimary}
        })
      }

      public async delete(where: UniqueWhere)
      {
        await mapper.delete(targetEntity.name, {...where, [targetRelation.name]: primaryValue})
      }

      public async disconnect(where: UniqueWhere)
      {
        await mapper.update(targetEntity.name, {...where, [targetRelation.name]: primaryValue}, {[targetRelation.name]: {disconnect: true}})
      }

      public async update(where: UniqueWhere, input: UpdateDataInput)
      {
        await mapper.update(targetEntity.name, {...where, [targetRelation.name]: primaryValue}, {
          ...input,
          // [targetRelation.name]: {connect: thisPrimary}
        })
      }

      public async upsert(where: UniqueWhere, update: UpdateDataInput, create: CreateDataInput)
      {
        const result = await mapper.update(targetEntity.name, {...where, [targetRelation.name]: primaryValue}, {
          ...update,
          // [targetRelation.name]: {connect: thisPrimary}
        })
        if (result === 0) {
          await mapper.insert(targetEntity.name, {
            ...create,
            [targetRelation.name]: {connect: thisPrimary}
          })
        }
      }
    })
  }

  public visitOneHasOneInversed(entity: Entity, relation: OneHasOneInversedRelation, targetEntity: Entity, targetRelation: OneHasOneOwnerRelation)
  {
    const relationData = this.data[relation.name] as UpdateOneRelationInput
    const thisPrimary = {[entity.primary]: this.primaryValue}

    const mapper = this.mapper

    const primaryValue = this.primaryValue

    return this.processHasOneRelationInput(relationData, new class implements HasOneRelationInputProcessor
    {
      public async connect(where: UniqueWhere)
      {
        await mapper.update(targetEntity.name, where, {[targetRelation.name]: {connect: thisPrimary}})
      }

      public async create(input: CreateDataInput)
      {
        await mapper.update(targetEntity.name, {[targetRelation.name]: primaryValue}, {[targetRelation.name]: {disconnect: true}})
        await mapper.insert(targetEntity.name, {
          ...input,
          [targetRelation.name]: {connect: thisPrimary}
        })
      }

      public async delete()
      {
        await mapper.delete(targetEntity.name, {[targetRelation.name]: primaryValue})
      }

      public async disconnect()
      {
        await mapper.update(targetEntity.name, {[targetRelation.name]: primaryValue}, {[targetRelation.name]: {disconnect: true}})
      }

      public async update(input: UpdateDataInput)
      {
        await mapper.update(targetEntity.name, {[targetRelation.name]: primaryValue}, input)
      }

      public async upsert(update: UpdateDataInput, create: CreateDataInput)
      {
        const result = await mapper.update(targetEntity.name, {[targetRelation.name]: primaryValue}, update)
        if (result === 0) {
          await mapper.insert(targetEntity.name, {
            ...create,
            [targetRelation.name]: {connect: thisPrimary}
          })
        }
      }
    })
  }

  public visitOneHasOneOwner(entity: Entity, relation: OneHasOneOwnerRelation, targetEntity: Entity, targetRelation: OneHasOneInversedRelation | null)
  {
    const relationData = this.data[relation.name] as UpdateOneRelationInput
    const updateBuilder = this.updateBuilder
    const mapper = this.mapper
    const primaryValue = this.primaryValue;
    const primaryUnique = {[entity.primary]: primaryValue}

    return this.processHasOneRelationInput(relationData, new class implements HasOneRelationInputProcessor
    {
      public async connect(input: UniqueWhere)
      {
        updateBuilder.addColumnData(relation.joiningColumn.columnName, async () => {
          const relationPrimary = await mapper.getPrimaryValue(targetEntity, input);
          const currentOwner = await mapper.selectField(entity.name, {[relation.name]: relationPrimary}, entity.primary)
          if (currentOwner === primaryValue) {
            return undefined
          }
          if (currentOwner) {
            await mapper.update(entity.name, {
              [entity.primary]: currentOwner,
            }, {[relation.name]: {disconnect: true}})
          }
          return relationPrimary
        })
      }

      public async create(input: CreateDataInput)
      {
        updateBuilder.addColumnData(relation.joiningColumn.columnName, mapper.insert(targetEntity.name, input))
      }

      public async delete()
      {
        updateBuilder.addColumnData(relation.joiningColumn.columnName, null)
        const inversedPrimary = await mapper.selectField(entity.name, primaryUnique, relation.name)
        await mapper.delete(targetEntity.name, {[targetEntity.primary]: inversedPrimary})
      }

      public async disconnect()
      {
        updateBuilder.addColumnData(relation.joiningColumn.columnName, null)
      }

      public async update(input: UpdateDataInput)
      {
        const inversedPrimary = await mapper.selectField(entity.name, primaryUnique, relation.name)
        await mapper.update(targetEntity.name, {[targetEntity.primary]: inversedPrimary}, input)
      }

      public async upsert(update: UpdateDataInput, create: CreateDataInput)
      {
        const select = mapper.selectField(entity.name, primaryUnique, relation.name)

        //addColumnData has to be called synchronously
        updateBuilder.addColumnData(relation.joiningColumn.columnName, async () => {
          const primary = await select
          if (primary) {
            return undefined
          }
          return mapper.insert(targetEntity.name, create)
        })

        const inversedPrimary = await select
        if (inversedPrimary) {
          await mapper.update(targetEntity.name, {[targetEntity.primary]: inversedPrimary}, update)
        }
      }
    })
  }

  private processHasOneRelationInput(input: UpdateOneRelationInput | undefined, processor: HasOneRelationInputProcessor): PromiseLike<any>
  {
    if (input === undefined) {
      return Promise.resolve(undefined)
    }
    const operation = []
    let result
    if (isIt<ConnectRelationInput>(input, "connect")) {
      operation.push("connect")
      result = processor.connect(input.connect)
    }
    if (isIt<CreateRelationInput>(input, "create")) {
      operation.push("create")
      result = processor.create(input.create)
    }
    if (isIt<DeleteRelationInput>(input, "delete")) {
      operation.push("delete")
      result = processor.delete()
    }
    if (isIt<DisconnectRelationInput>(input, "disconnect")) {
      operation.push("disconnect")
      result = processor.disconnect()
    }
    if (isIt<UpdateRelationInput>(input, "update")) {
      operation.push("update")
      result = processor.update(input.update)
    }
    if (isIt<UpsertRelationInput>(input, "upsert")) {
      operation.push("upsert")
      result = processor.upsert(input.upsert.update, input.upsert.create)
    }

    if (operation.length !== 1) {
      const found = operation.length === 0 ? "none" : operation.join(", ")
      throw new Error(`Expected exactly one of: "create", "connect", "delete", "disconnect", "update" or "upsert". ${found} found.`)
    }
    if (result === undefined) {
      throw new Error()
    }
    return result
  }

  private processHasManyRelationInput(input: UpdateManyRelationInput | undefined, processor: HasManyRelationInputProcessor): PromiseLike<any>
  {
    if (input === undefined) {
      return Promise.resolve(undefined)
    }
    const promises: Array<PromiseLike<void>> = []
    for (const element of input) {
      const operation = []
      let result
      if (isIt<ConnectRelationInput>(element, "connect")) {
        operation.push("connect")
        result = processor.connect(element.connect)
      }
      if (isIt<CreateRelationInput>(element, "create")) {
        operation.push("create")
        result = processor.create(element.create)
      }
      if (isIt<DeleteSpecifiedRelationInput>(element, "delete")) {
        operation.push("delete")
        result = processor.delete(element.delete)
      }
      if (isIt<DisconnectSpecifiedRelationInput>(element, "disconnect")) {
        operation.push("disconnect")
        result = processor.disconnect(element.disconnect)
      }
      if (isIt<UpdateSpecifiedRelationInput>(element, "update")) {
        operation.push("update")
        result = processor.update(element.update.where, element.update.data)
      }
      if (isIt<UpsertSpecifiedRelationInput>(element, "upsert")) {
        operation.push("upsert")
        result = processor.upsert(element.upsert.where, element.upsert.update, element.upsert.create)
      }
      if (operation.length !== 1) {
        const found = operation.length === 0 ? "none" : operation.join(", ")
        throw new Error(`Expected exactly one of: "create", "connect", "delete", "disconnect", "update" or "upsert". ${found} found.`)
      }
      if (result !== undefined) {
        promises.push(result)
      }
    }
    return Promise.all(promises)
  }
}
