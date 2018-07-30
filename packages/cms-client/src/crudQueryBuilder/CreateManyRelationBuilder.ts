import { CreateDataInput, CreateManyRelationInput, UniqueWhere } from "cms-common/src/schema/input";
import DataBuilder from "./DataBuilder";
import CreateDataBuilder from "./CreateDataBuilder";
import { Literal } from "../graphQlBuilder/Literal";

export default class CreateManyRelationBuilder
{
  constructor(
    public readonly data: CreateManyRelationInput<Literal> = []
  )
  {

  }

  public create(data: DataBuilder.DataLike<CreateDataInput<Literal>, CreateDataBuilder>)
  {
    return new CreateManyRelationBuilder([...this.data, {create: DataBuilder.resolveData(data, CreateDataBuilder)}])
  }

  public connect(where: UniqueWhere<Literal>)
  {
    return new CreateManyRelationBuilder([...this.data, {connect: where}])
  }
}
