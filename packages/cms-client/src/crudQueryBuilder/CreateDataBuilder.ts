import DataBuilder from './DataBuilder'
import CreateManyRelationBuilder from './CreateManyRelationBuilder'
import CreateOneRelationBuilder from './CreateOneRelationBuilder'
import Literal from '../graphQlBuilder/Literal'
import { Input } from 'cms-common'

export default class CreateDataBuilder {
  constructor(public readonly data: Input.CreateDataInput<Literal> = {}) {}

  public set(fieldName: string, value: Input.ColumnValue<Literal>) {
    return new CreateDataBuilder({ ...this.data, [fieldName]: value })
  }

  public many(
    fieldName: string,
    data: DataBuilder.DataLike<Input.CreateManyRelationInput<Literal>, CreateManyRelationBuilder>
  ) {
    return new CreateDataBuilder({
      ...this.data,
      [fieldName]: DataBuilder.resolveData(data, CreateManyRelationBuilder)
    })
  }

  public one(
    fieldName: string,
    data: DataBuilder.DataLike<
      Input.CreateOneRelationInput<Literal>,
      CreateOneRelationBuilder,
      CreateOneRelationBuilder<undefined>
    >
  ) {
    const value = DataBuilder.resolveData<
      Input.CreateOneRelationInput<Literal>,
      CreateOneRelationBuilder,
      CreateOneRelationBuilder<undefined>
    >(data, CreateOneRelationBuilder)
    return new CreateDataBuilder({ ...this.data, [fieldName]: value })
  }
}
