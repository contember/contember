import FieldBuilder from "./FieldBuilder"
import ColumnBuilder from "./ColumnBuilder"
import OneHasOneBuilder from "./OneHasOneBuilder"
import ManyHasManyBuilder from "./ManyHasManyBuilder"
import OneHasManyBuilder from "./OneHasManyBuilder"
import ManyHasOneBuilder from "./ManyHasOneBuilder"

class EntityBuilder
{
  private options: EntityBuilder.EntityOptions

  private fields: FieldBuilder.Map

  constructor(options: Partial<EntityBuilder.EntityOptions>, fields: FieldBuilder.Map = {})
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

  column(name: string, configurator: EntityBuilder.FieldConfigurator<ColumnBuilder, ColumnBuilder.Options>): EntityBuilder
  {
    const options = configurator(new ColumnBuilder({})).getOption()
    return new EntityBuilder(this.options, {...this.fields, [name]: {type: FieldBuilder.Type.Column, options: options}})
  }

  oneHasOne(name: string, configurator: EntityBuilder.FieldConfigurator<OneHasOneBuilder, OneHasOneBuilder.Options>): EntityBuilder
  {
    const options = configurator(new OneHasOneBuilder({})).getOption()
    return new EntityBuilder(this.options, {...this.fields, [name]: {type: FieldBuilder.Type.OneHasOne, options}})
  }

  manyHasMany(name: string, configurator: EntityBuilder.FieldConfigurator<ManyHasManyBuilder, ManyHasManyBuilder.Options>): EntityBuilder
  {
    const options = configurator(new ManyHasManyBuilder({})).getOption()
    return new EntityBuilder(this.options, {...this.fields, [name]: {type: FieldBuilder.Type.ManyHasMany, options}})
  }

  oneHasMany(name: string, configurator: EntityBuilder.FieldConfigurator<OneHasManyBuilder, OneHasManyBuilder.Options>): EntityBuilder
  {
    const options = configurator(new OneHasManyBuilder({})).getOption()
    return new EntityBuilder(this.options, {...this.fields, [name]: {type: FieldBuilder.Type.OneHasMany, options}})
  }


  manyHasOne(name: string, configurator: EntityBuilder.FieldConfigurator<ManyHasOneBuilder, ManyHasOneBuilder.Options>): EntityBuilder
  {
    const options = configurator(new ManyHasOneBuilder({})).getOption()
    return new EntityBuilder(this.options, {...this.fields, [name]: {type: FieldBuilder.Type.ManyHasOne, options}})
  }

  getOptions(): EntityBuilder.EntityOptions
  {
    return this.options
  }

  getFields(): FieldBuilder.Map
  {
    return this.fields
  }
}

namespace EntityBuilder
{
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
}

export default EntityBuilder
