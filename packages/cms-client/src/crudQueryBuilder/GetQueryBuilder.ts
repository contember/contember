import ObjectBuilder from '../graphQlBuilder/ObjectBuilder'
import Literal from '../graphQlBuilder/Literal'

import { Input } from 'cms-common'

export default class GetQueryBuilder<HasWhere extends boolean = false> {
  constructor(public readonly objectBuilder: ObjectBuilder = new ObjectBuilder()) {}

  where(where: Input.Where<Literal>) {
    return new GetQueryBuilder<true>(this.objectBuilder.argument('where', where))
  }

  column(name: string): GetQueryBuilder<HasWhere> {
    return new GetQueryBuilder(this.objectBuilder.field(name))
  }

  relation(
    name: string,
    builder: GetQueryBuilder | ((builder: GetQueryBuilder) => GetQueryBuilder)
  ): GetQueryBuilder<HasWhere> {
    if (!(builder instanceof GetQueryBuilder)) {
      builder = builder(new GetQueryBuilder())
    }
    return new GetQueryBuilder(this.objectBuilder.object(name, builder.objectBuilder))
  }
}
