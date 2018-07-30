import { CreateDataInput, CreateOneRelationInput, UniqueWhere } from "cms-common/src/schema/input";
import DataBuilder from "./DataBuilder";
import CreateDataBuilder from "./CreateDataBuilder";
import { Literal } from "../graphQlBuilder/Literal";

export default class CreateOneRelationBuilder<D extends CreateOneRelationInput<Literal> | undefined = CreateOneRelationInput<Literal>>
{
  constructor(
    public readonly data: D = undefined as D
  )
  {
  }

  public create(data: DataBuilder.DataLike<CreateDataInput<Literal>, CreateDataBuilder>)
  {
    return new CreateOneRelationBuilder({create: DataBuilder.resolveData(data, CreateDataBuilder)})
  }

  public connect(where: UniqueWhere<Literal>)
  {
    return new CreateOneRelationBuilder({connect: where})
  }
}
