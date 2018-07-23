import { FieldBuilder } from "./FieldConfigurator"
import { ColumnBuilder, ColumnOptions } from "./ColumnBuilder"
import { OneHasOneRelationBuilder, OneHasOneRelationOptions } from "./OneHasOneBuilder"
import { ManyHasManyRelationBuilder, ManyHasManyRelationOptions } from "./ManyHasManyBuilder"
import { OneHasManyRelationBuilder, OneHasManyRelationOptions } from "./OneHasManyBuilder"
import { ManyHasOneRelationBuilder, ManyHasOneRelationOptions } from "./ManyHasOneBuilder"

export type FieldConfigurator<B, O> = (builder: B) => FieldBuilder<O>


export type UniqueOptions = {
  fields: string[]
  name?: string
}

export type EntityOptions = {
  pluralName?: string
  primary?: string
  tableName?: string
  unique?: UniqueOptions[]
}

export enum FieldType
{
  Column = 'column',
  ManyHasMany = 'manyHasMany',
  OneHasOne = 'oneHasOne',
  OneHasMany = 'oneHasMany',
  ManyHasOne = 'manyHasOne',
}

export type FieldOptions =
  { type: FieldType.Column, options: ColumnOptions }
  | { type: FieldType.OneHasOne, options: OneHasOneRelationOptions }
  | { type: FieldType.ManyHasMany, options: ManyHasManyRelationOptions }
  | { type: FieldType.OneHasMany, options: OneHasManyRelationOptions }
  | { type: FieldType.ManyHasOne, options: ManyHasOneRelationOptions }
export type FieldOptionsMap = { [name: string]: FieldOptions }

export class EntityBuilder
{
  private options: EntityOptions

  private fields: FieldOptionsMap

  constructor(options: Partial<EntityOptions>, fields: FieldOptionsMap = {})
  {
    this.options = options
    this.fields = fields
  }

  pluralName(pluralName: string): EntityBuilder
  {
    return new EntityBuilder({...this.options, pluralName}, this.fields)
  }

  tableName(tableName: string): EntityBuilder
  {
    return new EntityBuilder({...this.options, tableName}, this.fields)
  }

  unique(fields: string[]): EntityBuilder
  {
    return new EntityBuilder({...this.options, unique: [...(this.options.unique || []), {fields: fields}]}, this.fields)
  }

  column(name: string, configurator: FieldConfigurator<ColumnBuilder, ColumnOptions>): EntityBuilder
  {
    const options = configurator(new ColumnBuilder({})).getOption()
    return new EntityBuilder(this.options, {...this.fields, [name]: {type: FieldType.Column, options: options}})
  }

  oneHasOne(name: string, configurator: FieldConfigurator<OneHasOneRelationBuilder, OneHasOneRelationOptions>): EntityBuilder
  {
    const options = configurator(new OneHasOneRelationBuilder({})).getOption()
    return new EntityBuilder(this.options, {...this.fields, [name]: {type: FieldType.OneHasOne, options}})
  }

  manyHasMany(name: string, configurator: FieldConfigurator<ManyHasManyRelationBuilder, ManyHasManyRelationOptions>): EntityBuilder
  {
    const options = configurator(new ManyHasManyRelationBuilder({})).getOption()
    return new EntityBuilder(this.options, {...this.fields, [name]: {type: FieldType.ManyHasMany, options}})
  }

  oneHasMany(name: string, configurator: FieldConfigurator<OneHasManyRelationBuilder, OneHasManyRelationOptions>): EntityBuilder
  {
    const options = configurator(new OneHasManyRelationBuilder({})).getOption()
    return new EntityBuilder(this.options, {...this.fields, [name]: {type: FieldType.OneHasMany, options}})
  }


  manyHasOne(name: string, configurator: FieldConfigurator<ManyHasOneRelationBuilder, ManyHasOneRelationOptions>): EntityBuilder
  {
    const options = configurator(new ManyHasOneRelationBuilder({})).getOption()
    return new EntityBuilder(this.options, {...this.fields, [name]: {type: FieldType.ManyHasOne, options}})
  }

  getOptions(): EntityOptions
  {
    return this.options
  }

  getFields(): FieldOptionsMap
  {
    return this.fields
  }
}
