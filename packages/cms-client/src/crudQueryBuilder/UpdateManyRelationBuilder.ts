import { CreateDataInput, UniqueWhere, UpdateDataInput, UpdateManyRelationInput } from "cms-common/src/schema/input";
import QueryBuilder from "../graphQlBuilder/QueryBuilder";
import DataBuilder from './DataBuilder'
import CreateDataBuilder from "./CreateDataBuilder";
import UpdateDataBuilder from "./UpdateDataBuilder";
import { Literal } from "../graphQlBuilder/Literal";

export default class UpdateManyRelationBuilder
{
  constructor(
    public readonly data: UpdateManyRelationInput<Literal> = []
  )
  {
  }

  public create(data: DataBuilder.DataLike<CreateDataInput<Literal>, CreateDataBuilder>)
  {
    return new UpdateManyRelationBuilder([...this.data, {create: DataBuilder.resolveData(data, CreateDataBuilder)}])
  }

  public connect(where: UniqueWhere<Literal>)
  {
    return new UpdateManyRelationBuilder([...this.data, {connect: where}])
  }

  public delete(where: UniqueWhere<Literal>)
  {
    return new UpdateManyRelationBuilder([...this.data, {delete: where}])
  }

  public disconnect(where: UniqueWhere<Literal>)
  {
    return new UpdateManyRelationBuilder([...this.data, {disconnect: where}])
  }

  public update(
    where: UniqueWhere<Literal>,
    data: DataBuilder.DataLike<UpdateDataInput<Literal>, UpdateDataBuilder>)
  {
    const input = DataBuilder.resolveData(data, UpdateDataBuilder);
    return new UpdateManyRelationBuilder([...this.data, {update: {where, data: input}}])
  }

  public upsert(
    where: UniqueWhere<Literal>,
    update: DataBuilder.DataLike<UpdateDataInput<Literal>, UpdateDataBuilder>,
    create: DataBuilder.DataLike<CreateDataInput<Literal>, CreateDataBuilder>)
  {
    const updateInput = DataBuilder.resolveData(update, UpdateDataBuilder)
    const createInput = DataBuilder.resolveData(create, CreateDataBuilder)
    return new UpdateManyRelationBuilder([...this.data, {
      upsert: {
        where,
        update: updateInput,
        create: createInput,
      }
    }])
  }
}
