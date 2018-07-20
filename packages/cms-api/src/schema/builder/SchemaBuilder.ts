import { Schema } from "../model"
import { EntityBuilder } from "./EntityBuilder"
import { DefaultNamingConventions, NamingConventions } from "./NamingConventions";
import SchemaBuilderInternal from "./SchemaBuilderInternal";


export type EntityConfigurator<E> = (entityBuilder: EntityBuilder) => EntityBuilder

export default class SchemaBuilder
{
  private entities: { [name: string]: EntityConfigurator<any> } = {}
  private enums: { [name: string]: string[] } = {}
  private conventions: NamingConventions

  constructor(conventions: NamingConventions = new DefaultNamingConventions())
  {
    this.conventions = conventions
  }

  public enum(name: string, values: string[]): SchemaBuilder
  {
    this.enums[name] = values
    return this
  }

  public entity(name: string, configurator: EntityConfigurator<any>): SchemaBuilder
  {
    this.entities[name] = configurator
    return this
  }

  public buildSchema(): Schema
  {
    const builder = new SchemaBuilderInternal(this.conventions)

    for (let name in this.entities) {
      const configurator = this.entities[name]
      const entityBuilder: EntityBuilder = configurator(new EntityBuilder({}, {}))
      const entityOptions = entityBuilder.getOptions()
      const fields = entityBuilder.getFields()
      builder.addEntity(name, entityOptions, fields)
    }
    Object.keys(this.enums).forEach(name => builder.addEnum(name, this.enums[name]))

    return builder.createSchema()
  }

}

export class SchemaBuilderError extends Error
{
}

