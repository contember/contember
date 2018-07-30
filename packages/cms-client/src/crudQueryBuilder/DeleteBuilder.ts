import { ObjectBuilder } from "../graphQlBuilder/ObjectBuilder";
import { UniqueWhere } from "cms-common/dist/schema/input";
import { Literal } from "../graphQlBuilder/Literal";


export default class DeleteBuilder
{
  constructor(
    public readonly objectBuilder: ObjectBuilder = new ObjectBuilder()
  )
  {
  }

  where(where: UniqueWhere<Literal>)
  {
    return new DeleteBuilder(this.objectBuilder.argument('where', where))
  }

  column(name: string)
  {
    return new DeleteBuilder(this.objectBuilder.field(name))
  }

  relation(name: string, builder: ObjectBuilder | ((builder: ObjectBuilder) => ObjectBuilder))
  {
    if (!(builder instanceof ObjectBuilder)) {
      builder = builder(new ObjectBuilder())
    }
    return new DeleteBuilder(this.objectBuilder.object(name, builder))
  }
}
