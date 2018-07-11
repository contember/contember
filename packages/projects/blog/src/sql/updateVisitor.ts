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
import {
  ConnectRelationInput,
  CreateInput,
  CreateManyRelationInput,
  CreateRelationInput,
  DeleteRelationInput,
  DeleteSpecifiedRelationInput,
  DisconnectRelationInput,
  DisconnectSpecifiedRelationInput,
  PrimaryValue,
  UniqueWhere,
  UpdateInput,
  UpdateManyRelationInput,
  UpdateOneRelationInput,
  UpdateRelationInput,
  UpdateSpecifiedRelationInput,
  UpsertRelationInput,
  UpsertSpecifiedRelationInput
} from "./types";
import { Mapper, UpdateBuilder } from "./mapper";
import { isIt } from "../utils/type";


interface HasOneRelationInputProcessor
{
  connect(input: UniqueWhere): void | PromiseLike<void>

  create(input: CreateInput): void | PromiseLike<void>

  update(input: UpdateInput): void | PromiseLike<void>

  upsert(update: UpdateInput, create: CreateInput): void | PromiseLike<void>

  disconnect(): void | PromiseLike<void>

  delete(): void | PromiseLike<void>
}

interface HasManyRelationInputProcessor
{
  connect(input: UniqueWhere): void | PromiseLike<void>

  create(input: CreateInput): void | PromiseLike<void>

  update(where: UniqueWhere, input: UpdateInput): void | PromiseLike<void>

  upsert(where: UniqueWhere, update: UpdateInput, create: CreateInput): void | PromiseLike<void>

  disconnect(where: UniqueWhere): void | PromiseLike<void>

  delete(where: UniqueWhere): void | PromiseLike<void>
}


export default class UpdateVisitor implements ColumnVisitor<void>, RelationByTypeVisitor<void>
{
  private primaryValue: PrimaryValue
  private data: CreateInput;
  private updateBuilder: UpdateBuilder;
  private mapper: Mapper;
  private db: Knex;

  constructor(primaryValue: PrimaryValue, data: CreateInput, updateBuilder: UpdateBuilder, mapper: Mapper, db: Knex)
  {
    this.primaryValue = primaryValue
    this.data = data;
    this.updateBuilder = updateBuilder;
    this.mapper = mapper;
    this.db = db;
  }

  visitColumn(entity: Entity, column: Column): void
  {
    if (this.data[column.name] !== undefined) {
      this.updateBuilder.addColumnData(column.columnName, this.data[column.name])
    }
  }

  visitManyHasManyInversed(entity: Entity, relation: ManyHasManyInversedRelation, targetEntity: Entity, targetRelation: ManyHasManyOwnerRelation): void
  {
    const relationData = this.data[relation.name] as CreateManyRelationInput
    if (relationData === undefined) {
      return
    }
    const thisUnique = {[entity.primary]: this.primaryValue}

    const mapper = this.mapper
    const onAfterUpdate = this.updateBuilder.onAfterUpdate.bind(this.updateBuilder)

    const connect = (primaryUnique: UniqueWhere) => mapper.connectJunction(targetEntity, targetRelation, primaryUnique, thisUnique)
    const disconnect = (primaryUnique: UniqueWhere) => mapper.disconnectJunction(targetEntity, targetRelation, primaryUnique, thisUnique)

    this.processHasManyRelationInput(relationData, new class implements HasManyRelationInputProcessor
    {
      connect(input: UniqueWhere): void
      {
        onAfterUpdate(async () => await connect(input))
      }

      create(input: CreateInput): void
      {
        onAfterUpdate(async () => {
            const primaryOwner = await mapper.insert(targetEntity.name, input)
            return await connect({[targetEntity.primary]: primaryOwner})
          }
        )
      }

      delete(where: UniqueWhere): void
      {
        onAfterUpdate(async () => {
          await disconnect(where)
          await mapper.delete(targetEntity.name, where)
        })
      }

      disconnect(where: UniqueWhere): void
      {
        onAfterUpdate(async () =>
          await disconnect(where)
        )
      }

      update(where: UniqueWhere, input: UpdateInput): void
      {
        onAfterUpdate(async () => {
          //fixme should check if relation really exists
          await mapper.update(targetEntity.name, where, input)
          await connect(where)
        })
      }

      upsert(where: UniqueWhere, update: UpdateInput, create: CreateInput): void
      {
        onAfterUpdate(async () => {
          //fixme should check if relation really exists
          const result = await mapper.update(targetEntity.name, where, update)
          if (result > 0) {
            //fixme it should already exist
            await connect(where)
          } else {
            const primaryValue = await mapper.insert(targetEntity.name, create)
            await connect({[targetEntity.primary]: primaryValue})
          }
        })
      }
    })
  }

  visitManyHasManyOwner(entity: Entity, relation: ManyHasManyOwnerRelation, targetEntity: Entity, targetRelation: ManyHasManyInversedRelation | null): void
  {
    const relationData = this.data[relation.name] as UpdateManyRelationInput
    if (relationData === undefined) {
      return
    }
    const primaryUnique = {[entity.primary]: this.primaryValue}

    const mapper = this.mapper
    const onAfterUpdate = this.updateBuilder.onAfterUpdate.bind(this.updateBuilder)

    const connect = (inversedUnique: UniqueWhere) => mapper.connectJunction(entity, relation, primaryUnique, inversedUnique)
    const disconnect = (inversedUnique: UniqueWhere) => mapper.disconnectJunction(entity, relation, primaryUnique, inversedUnique)

    this.processHasManyRelationInput(relationData, new class implements HasManyRelationInputProcessor
    {
      connect(input: UniqueWhere): void
      {
        onAfterUpdate(async () =>
          await connect(input)
        )
      }

      create(input: CreateInput): void
      {
        onAfterUpdate(async () => {
            const primaryOwner = await mapper.insert(targetEntity.name, input)
            await connect({[targetEntity.primary]: primaryOwner})
          }
        )
      }

      delete(where: UniqueWhere): void
      {
        onAfterUpdate(async () => {
          await disconnect(where)
          await mapper.delete(targetEntity.name, where)
        })
      }

      disconnect(where: UniqueWhere): void
      {
        onAfterUpdate(async () =>
          await disconnect(where)
        )
      }

      update(where: UniqueWhere, input: UpdateInput): void
      {
        onAfterUpdate(async () => {
          //fixme should check if relation really exists
          await mapper.update(targetEntity.name, where, input)
          //fixme it should already exist
          await connect(where)
        })
      }

      upsert(where: UniqueWhere, update: UpdateInput, create: CreateInput): void
      {
        onAfterUpdate(async () => {
          //fixme should check if relation really exists
          const result = await mapper.update(targetEntity.name, where, update)
          if (result > 0) {
            //fixme it should already exist
            await connect(where)
          } else {
            const primaryValue = await mapper.insert(targetEntity.name, create)
            await connect({[targetEntity.primary]: primaryValue})
          }
        })
      }
    })
  }


  visitManyHasOne(entity: Entity, relation: ManyHasOneRelation, targetEntity: Entity, targetRelation: OneHasManyRelation | null): void
  {
    const relationData = this.data[relation.name] as UpdateOneRelationInput
    const updateBuilder = this.updateBuilder
    const mapper = this.mapper
    const primaryUnique = {[entity.primary]: this.primaryValue}

    this.processHasOneRelationInput(relationData, new class implements HasOneRelationInputProcessor
    {
      connect(input: UniqueWhere): void
      {
        updateBuilder.addColumnData(relation.joiningColumn.columnName, mapper.getPrimaryValue(targetEntity, input))
      }

      create(input: CreateInput): void
      {
        updateBuilder.addColumnData(relation.joiningColumn.columnName, mapper.insert(targetEntity.name, input))
      }

      async delete()
      {
        const inversedPrimary = await mapper.selectField(entity.name, primaryUnique, relation.name)
        updateBuilder.addColumnData(relation.joiningColumn.columnName, null)
        updateBuilder.onAfterUpdate(() =>
          mapper.delete(targetEntity.name, {[targetEntity.primary]: inversedPrimary})
        )
      }

      async disconnect()
      {
        updateBuilder.addColumnData(relation.joiningColumn.columnName, null)
      }

      async update(input: UpdateInput)
      {
        const inversedPrimary = await mapper.selectField(entity.name, primaryUnique, relation.name)
        updateBuilder.onAfterUpdate(() =>
          mapper.update(targetEntity.name, {[targetEntity.primary]: inversedPrimary}, input)
        )
      }

      async upsert(update: UpdateInput, create: CreateInput)
      {
        const inversedPrimary = await mapper.selectField(entity.name, primaryUnique, relation.name)
        if (!inversedPrimary) {
          updateBuilder.addColumnData(relation.joiningColumn.columnName, await mapper.insert(targetEntity.name, create))
        } else {
          updateBuilder.onAfterUpdate(async () => await mapper.update(targetEntity.name, {[targetEntity.primary]: inversedPrimary}, update))
        }
      }
    })
  }

  visitOneHasMany(entity: Entity, relation: OneHasManyRelation, targetEntity: Entity, targetRelation: ManyHasOneRelation): void
  {
    const relationData = this.data[relation.name] as CreateManyRelationInput
    if (relationData === undefined) {
      return
    }
    const primaryValue = this.primaryValue;
    const thisPrimary = {[entity.primary]: primaryValue}

    const mapper = this.mapper
    const onAfterUpdate = this.updateBuilder.onAfterUpdate.bind(this.updateBuilder)

    this.processHasManyRelationInput(relationData, new class implements HasManyRelationInputProcessor
    {
      connect(input: UniqueWhere): void
      {
        onAfterUpdate(async () => await mapper.update(targetEntity.name, input, {
          [targetRelation.name]: {connect: thisPrimary}
        }))
      }

      create(input: CreateInput): void
      {
        onAfterUpdate(async () => {
            return await mapper.insert(targetEntity.name, {
              ...input,
              [targetRelation.name]: {connect: thisPrimary}
            })
          }
        )
      }

      delete(where: UniqueWhere): void
      {
        onAfterUpdate(async () => {
          await mapper.delete(targetEntity.name, {...where, [targetRelation.name]: primaryValue})
        })
      }

      disconnect(where: UniqueWhere): void
      {
        onAfterUpdate(async () =>
          await mapper.update(targetEntity.name, {...where, [targetRelation.name]: primaryValue}, {[targetRelation.name]: {disconnect: true}})
        )
      }

      update(where: UniqueWhere, input: UpdateInput): void
      {
        onAfterUpdate(async () => {
          //fixme should check if relation really exists
          await mapper.update(targetEntity.name, {...where, [targetRelation.name]: primaryValue}, {
            ...input,
            [targetRelation.name]: {connect: thisPrimary}
          })
        })
      }

      upsert(where: UniqueWhere, update: UpdateInput, create: CreateInput): void
      {
        onAfterUpdate(async () => {
          //fixme should check if relation really exists
          const result = await mapper.update(targetEntity.name, {...where, [targetRelation.name]: primaryValue}, {
            ...update,
            [targetRelation.name]: {connect: thisPrimary}
          })
          if (result === 0) {
            await mapper.insert(targetEntity.name, {
              ...create,
              [targetRelation.name]: {connect: thisPrimary}
            })
          }
        })
      }
    })
  }

  visitOneHasOneInversed(entity: Entity, relation: OneHasOneInversedRelation, targetEntity: Entity, targetRelation: OneHasOneOwnerRelation): void
  {
    const relationData = this.data[relation.name] as UpdateOneRelationInput
    const thisPrimary = {[entity.primary]: this.primaryValue}

    const mapper = this.mapper
    const onAfterUpdate = this.updateBuilder.onAfterUpdate.bind(this.updateBuilder)

    const primaryValue = this.primaryValue

    this.processHasOneRelationInput(relationData, new class implements HasOneRelationInputProcessor
    {
      connect(where: UniqueWhere): void
      {
        onAfterUpdate(async () => {
          await mapper.update(targetEntity.name, where, {[targetRelation.name]: {connect: thisPrimary}})
        })
      }

      create(input: CreateInput): void
      {
        onAfterUpdate(async () => {
          await mapper.update(targetEntity.name, {[targetRelation.name]: primaryValue}, {[targetRelation.name]: {disconnect: true}})
          await mapper.insert(targetEntity.name, {
              ...input,
              [targetRelation.name]: {connect: thisPrimary}
            })
          }
        )
      }

      delete(): void
      {
        onAfterUpdate(async () => {
          await mapper.delete(targetEntity.name, {[targetRelation.name]: primaryValue})
        })
      }

      disconnect(): void
      {
        onAfterUpdate(async () =>
          await mapper.update(targetEntity.name, {[targetRelation.name]: primaryValue}, {[targetRelation.name]: {disconnect: true}})
        )
      }

      update(input: UpdateInput): void
      {
        onAfterUpdate(async () => {
          await mapper.update(targetEntity.name, {[targetRelation.name]: primaryValue}, {[targetRelation.name]: {
              ...input,
              [targetRelation.name]: {connect: thisPrimary}
            }})
        })
      }

      upsert(update: UpdateInput, create: CreateInput): void
      {
        onAfterUpdate(async () => {
          const result = await mapper.update(targetEntity.name, {[targetRelation.name]: primaryValue}, {
            ...update,
            [targetRelation.name]: {connect: thisPrimary}
          })
          if (result === 0) {
            await mapper.insert(targetEntity.name, {
              ...create,
              [targetRelation.name]: {connect: thisPrimary}
            })
          }
        })
      }
    })
  }


  visitOneHasOneOwner(entity: Entity, relation: OneHasOneOwnerRelation, targetEntity: Entity, targetRelation: OneHasOneInversedRelation | null): void
  {
    const relationData = this.data[relation.name] as UpdateOneRelationInput
    const updateBuilder = this.updateBuilder
    const mapper = this.mapper
    const primaryUnique = {[entity.primary]: this.primaryValue}

    this.processHasOneRelationInput(relationData, new class implements HasOneRelationInputProcessor
    {
      async connect(input: UniqueWhere)
      {
        await mapper.update(entity.name, {[relation.name]: await mapper.getPrimaryValue(targetEntity, input)}, {[relation.name]: {disconnect: true}})

        updateBuilder.addColumnData(relation.joiningColumn.columnName, mapper.getPrimaryValue(targetEntity, input))
      }

      create(input: CreateInput): void
      {
        updateBuilder.addColumnData(relation.joiningColumn.columnName, mapper.insert(targetEntity.name, input))
      }

      async delete()
      {
        const inversedPrimary = await mapper.selectField(entity.name, primaryUnique, relation.name)
        updateBuilder.addColumnData(relation.joiningColumn.columnName, null)
        updateBuilder.onAfterUpdate(() =>
          mapper.delete(targetEntity.name, {[targetEntity.primary]: inversedPrimary})
        )
      }

      async disconnect()
      {
        updateBuilder.addColumnData(relation.joiningColumn.columnName, null)
      }

      async update(input: UpdateInput)
      {
        const inversedPrimary = await mapper.selectField(entity.name, primaryUnique, relation.name)
        updateBuilder.onAfterUpdate(() =>
          mapper.update(targetEntity.name, {[targetEntity.primary]: inversedPrimary}, input)
        )
      }

      async upsert(update: UpdateInput, create: CreateInput)
      {
        const inversedPrimary = await mapper.selectField(entity.name, primaryUnique, relation.name)
        if (!inversedPrimary) {
          updateBuilder.addColumnData(relation.joiningColumn.columnName, await mapper.insert(targetEntity.name, create))
        } else {
          updateBuilder.onAfterUpdate(async () => await mapper.update(targetEntity.name, {[targetEntity.primary]: inversedPrimary}, update))
        }
      }
    })
  }

  private processHasOneRelationInput(input: UpdateOneRelationInput | undefined, processor: HasOneRelationInputProcessor)
  {
    if (input === undefined) {
      return
    }
    const operation = []
    let result = undefined
    if (isIt<ConnectRelationInput>(input, 'connect')) {
      operation.push('connect')
      result = processor.connect(input.connect)
    }
    if (isIt<CreateRelationInput>(input, 'create')) {
      operation.push('create')
      result = processor.create(input.create)
    }
    if (isIt<DeleteRelationInput>(input, 'delete')) {
      operation.push('delete')
      result = processor.delete()
    }
    if (isIt<DisconnectRelationInput>(input, 'disconnect')) {
      operation.push('disconnect')
      result = processor.disconnect()
    }
    if (isIt<UpdateRelationInput>(input, 'update')) {
      operation.push('update')
      result = processor.update(input.update)
    }
    if (isIt<UpsertRelationInput>(input, 'upsert')) {
      operation.push('upsert')
      result = processor.upsert(input.upsert.update, input.upsert.create)
    }

    if (result !== undefined) {
      this.updateBuilder.onBeforeUpdate(Promise.resolve(result))
    }

    if (operation.length !== 1) {
      const found = operation.length === 0 ? "none" : operation.join(', ')
      throw new Error(`Expected exactly one of: "create", "connect", "delete", "disconnect", "update" or "upsert". ${found} found.`)
    }
  }

  private processHasManyRelationInput(input: UpdateManyRelationInput | undefined, processor: HasManyRelationInputProcessor)
  {
    if (input === undefined) {
      return
    }
    for (let element of input) {
      const operation = []
      let result = undefined
      if (isIt<ConnectRelationInput>(element, 'connect')) {
        operation.push('connect')
        result = processor.connect(element.connect)
      }
      if (isIt<CreateRelationInput>(element, 'create')) {
        operation.push('create')
        result = processor.create(element.create)
      }
      if (isIt<DeleteSpecifiedRelationInput>(element, 'delete')) {
        operation.push('delete')
        result = processor.delete(element.delete)
      }
      if (isIt<DisconnectSpecifiedRelationInput>(element, 'disconnect')) {
        operation.push('disconnect')
        result = processor.disconnect(element.disconnect)
      }
      if (isIt<UpdateSpecifiedRelationInput>(element, 'update')) {
        operation.push('update')
        result = processor.update(element.update.where, element.update.data)
      }
      if (isIt<UpsertSpecifiedRelationInput>(element, 'upsert')) {
        operation.push('upsert')
        result = processor.upsert(element.upsert.where, element.upsert.update, element.upsert.create)
      }
      if (result !== undefined) {
        this.updateBuilder.onBeforeUpdate(Promise.resolve(result))
      }

      if (operation.length !== 1) {
        const found = operation.length === 0 ? "none" : operation.join(', ')
        throw new Error(`Expected exactly one of: "create", "connect", "delete", "disconnect", "update" or "upsert". ${found} found.`)
      }
    }
  }
}
