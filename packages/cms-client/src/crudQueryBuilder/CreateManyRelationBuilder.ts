import DataBuilder from './DataBuilder'
import CreateDataBuilder from './CreateDataBuilder'
import Literal from '../graphQlBuilder/Literal'

import { Input } from 'cms-common'

export default class CreateManyRelationBuilder {
  constructor(public readonly data: Input.CreateManyRelationInput<Literal> = []) {}

  public create(data: DataBuilder.DataLike<Input.CreateDataInput<Literal>, CreateDataBuilder>) {
    return new CreateManyRelationBuilder([...this.data, { create: DataBuilder.resolveData(data, CreateDataBuilder) }])
  }

  public connect(where: Input.UniqueWhere<Literal>) {
    return new CreateManyRelationBuilder([...this.data, { connect: where }])
  }
}
