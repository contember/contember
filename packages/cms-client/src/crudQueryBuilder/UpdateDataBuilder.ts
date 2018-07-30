import { UpdateDataInput, UpdateManyRelationInput, UpdateOneRelationInput } from "cms-common/dist/schema/input"
import DataBuilder from './DataBuilder'
import UpdateManyRelationBuilder from "./UpdateManyRelationBuilder";
import UpdateOneRelationBuilder from "./UpdateOneRelationBuilder";
import { Literal } from "../graphQlBuilder/Literal";
import { ColumnValue } from "../../../cms-common/src/schema/input";

export default class UpdateDataBuilder
{
  constructor(
    public readonly data: UpdateDataInput<Literal> = {}
  )
  {
  }

  public set(fieldName: string, value: ColumnValue<Literal>)
  {
    return new UpdateDataBuilder({...this.data, [fieldName]: value})
  }

  public many(fieldName: string, data: DataBuilder.DataLike<UpdateManyRelationInput<Literal>, UpdateManyRelationBuilder>)
  {
    return new UpdateDataBuilder({...this.data, [fieldName]: DataBuilder.resolveData(data, UpdateManyRelationBuilder)})
  }

  public one(fieldName: string, data: DataBuilder.DataLike<UpdateOneRelationInput<Literal>, UpdateOneRelationBuilder, UpdateOneRelationBuilder<undefined>>)
  {
    const input = DataBuilder.resolveData<UpdateOneRelationInput<Literal>, UpdateOneRelationBuilder, UpdateOneRelationBuilder<undefined>>(data, UpdateOneRelationBuilder)
    return new UpdateDataBuilder({...this.data, [fieldName]: input})
  }
}
