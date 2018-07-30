import { ObjectBuilder } from "../graphQlBuilder/ObjectBuilder";
import { Where } from "cms-common/dist/schema/input";
import { Literal } from "../graphQlBuilder/Literal";

export default class ListQueryBuilder
{
  constructor(
    public readonly objectBuilder: ObjectBuilder = new ObjectBuilder()
  )
  {
  }

  where(where: Where<Literal>)
  {
    return new ListQueryBuilder(this.objectBuilder.argument('where', where))
  }

  column(name: string)
  {
    return new ListQueryBuilder(this.objectBuilder.field(name))
  }

  relation(name: string, builder: ListQueryBuilder | ((builder: ListQueryBuilder) => ListQueryBuilder))
  {
    if (!(builder instanceof ListQueryBuilder)) {
      builder = builder(new ListQueryBuilder())
    }
    return new ListQueryBuilder(this.objectBuilder.object(name, builder.objectBuilder))
  }
}
