import { CreateDataInput, UniqueWhere, UpdateDataInput, UpdateOneRelationInput } from "cms-common/src/schema/input";
import DataBuilder from './DataBuilder'
import CreateDataBuilder from "./CreateDataBuilder";
import UpdateDataBuilder from "./UpdateDataBuilder";
import { Literal } from "../graphQlBuilder/Literal";

export default class UpdateOneRelationBuilder<D extends UpdateOneRelationInput<Literal> | undefined = UpdateOneRelationInput<Literal>>
{
  constructor(
    public readonly data: D = undefined as D
  )
  {
  }

  public create(data: DataBuilder.DataLike<CreateDataInput<Literal>, CreateDataBuilder>)
  {
    return new UpdateOneRelationBuilder({create: DataBuilder.resolveData(data, CreateDataBuilder)})
  }

  public connect(where: UniqueWhere<Literal>)
  {
    return new UpdateOneRelationBuilder({connect: where})
  }

  public delete()
  {
    return new UpdateOneRelationBuilder({delete: true})
  }

  public disconnect()
  {
    return new UpdateOneRelationBuilder({disconnect: true})
  }

  public update(data: DataBuilder.DataLike<UpdateDataInput<Literal>, UpdateDataBuilder>)
  {
    return new UpdateOneRelationBuilder({update: DataBuilder.resolveData(data, UpdateDataBuilder)})
  }

  public upsert(
    update: DataBuilder.DataLike<UpdateDataInput<Literal>, UpdateDataBuilder>,
    create: DataBuilder.DataLike<CreateDataInput<Literal>, CreateDataBuilder>)
  {
    return new UpdateOneRelationBuilder({
      upsert: {
        update: DataBuilder.resolveData(update, UpdateDataBuilder),
        create: DataBuilder.resolveData(create, CreateDataBuilder),
      }
    })
  }
}
