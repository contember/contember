import { ObjectBuilder } from "../graphQlBuilder/ObjectBuilder";
import { UniqueWhere, UpdateDataInput } from "cms-common/dist/schema/input";
import UpdateDataBuilder from "./UpdateDataBuilder";
import DataBuilder from "./DataBuilder";
import { Literal } from "../graphQlBuilder/Literal";


export default class UpdateBuilder
{
  constructor(
    public readonly objectBuilder: ObjectBuilder = new ObjectBuilder()
  )
  {
  }

  where(where: UniqueWhere<Literal>)
  {
    return new UpdateBuilder(this.objectBuilder.argument('where', where))
  }

  data(data: DataBuilder.DataLike<UpdateDataInput<Literal>, UpdateDataBuilder>)
  {
    return new UpdateBuilder(this.objectBuilder.argument('data', DataBuilder.resolveData(data, UpdateDataBuilder)))
  }

  column(name: string)
  {
    return new UpdateBuilder(this.objectBuilder.field(name))
  }

  relation(name: string, builder: ObjectBuilder | ((builder: ObjectBuilder) => ObjectBuilder))
  {
    if (!(builder instanceof ObjectBuilder)) {
      builder = builder(new ObjectBuilder())
    }
    return new UpdateBuilder(this.objectBuilder.object(name, builder))
  }
}
