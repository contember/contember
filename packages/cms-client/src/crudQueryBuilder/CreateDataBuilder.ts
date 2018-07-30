import { CreateDataInput, CreateManyRelationInput, CreateOneRelationInput } from "cms-common/src/schema/input";
import DataBuilder from "./DataBuilder";
import CreateManyRelationBuilder from "./CreateManyRelationBuilder";
import CreateOneRelationBuilder from "./CreateOneRelationBuilder";
import { Literal } from "../graphQlBuilder/Literal";
import { ColumnValue } from "../../../cms-common/src/schema/input";

export default class CreateDataBuilder
{
  constructor(
    public readonly data: CreateDataInput<Literal> = {}
  )
  {
  }

  public set(fieldName: string, value: ColumnValue<Literal>)
  {
    return new CreateDataBuilder({...this.data, [fieldName]: value})
  }

  public many(fieldName: string, data: DataBuilder.DataLike<CreateManyRelationInput<Literal>, CreateManyRelationBuilder>)
  {
    return new CreateDataBuilder({...this.data, [fieldName]: DataBuilder.resolveData(data, CreateManyRelationBuilder)})
  }

  public one(fieldName: string, data: DataBuilder.DataLike<CreateOneRelationInput<Literal>, CreateOneRelationBuilder, CreateOneRelationBuilder<undefined>>)
  {
    const value = DataBuilder.resolveData<CreateOneRelationInput<Literal>, CreateOneRelationBuilder, CreateOneRelationBuilder<undefined>>(data, CreateOneRelationBuilder)
    return new CreateDataBuilder({...this.data, [fieldName]: value})
  }
}
