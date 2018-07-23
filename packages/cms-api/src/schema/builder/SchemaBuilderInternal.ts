import { AnyRelation, Column, Entity, Schema } from "../model"
import { EntityOptions, FieldOptions, FieldOptionsMap, FieldType } from "./EntityBuilder"
import { SchemaBuilderError } from "./SchemaBuilder"
import { Error } from "tslint/lib/error"
import { FieldProcessor } from "./internal/FieldProcessor"
import ColumnProcessor from "./internal/ColumnProcessor"
import ManyHasManyProcessor from "./internal/ManyHasManyProcessor"
import OneHasOneProcessor from "./internal/OneHasOneProcessor"
import OneHasManyProcessor from "./internal/OneHasManyProcessor"
import ManyHasOneProcessor from "./internal/ManyHasOneProcessor"
import { NamingConventions } from "./NamingConventions";

export default class SchemaBuilderInternal
{
  private entities: { [name: string]: Entity } = {}

  private fieldOptions: { [entity: string]: FieldOptionsMap } = {}

  private enums: { [name: string]: string[] } = {}

  private conventions: NamingConventions

  constructor(conventions: NamingConventions)
  {
    this.conventions = conventions
  }

  public addEntity(name: string, options: EntityOptions, fieldOptions: FieldOptionsMap): void
  {
    this.fieldOptions[name] = fieldOptions
    const primaryName = this.getPrimaryFieldName(options, name, fieldOptions)
    if (!fieldOptions[primaryName]) {
      fieldOptions[primaryName] = this.createDefaultPrimary(primaryName)
    }
    const primaryField = fieldOptions[primaryName]
    if (primaryField.type !== FieldType.Column) {
      throw new SchemaBuilderError(`${name}: Primary field must be a column`)
    }

    this.entities[name] = {
      name: name,
      pluralName: options.pluralName || this.conventions.getPlural(name),
      primary: primaryName,
      primaryColumn: primaryField.options.columnName || this.conventions.getColumnName(primaryName),
      unique: this.createUnique(options, fieldOptions),
      fields: {},
      tableName: options.tableName || this.conventions.getTableName(name),
    }
  }

  public addEnum(name: string, values: string[]): void
  {
    this.enums[name] = values
  }

  public createSchema(): Schema
  {
    for (let entityName in this.fieldOptions) {
      let primaryField = this.entities[entityName].primary
      this.processField(entityName, primaryField)
      for (let fieldName in this.fieldOptions[entityName]) {
        if (fieldName === primaryField) {
          continue
        }
        this.processField(entityName, fieldName)
      }
    }

    return {
      enums: this.enums,
      entities: this.entities,
    }
  }

  private processField(entityName: string, fieldName: string): void
  {
    const processor = this.createProcessor(entityName, fieldName)
    processor.process(entityName, fieldName, this.fieldOptions[entityName][fieldName].options, this.registerField.bind(this))
  }

  private createProcessor(entityName: string, fieldName: string): FieldProcessor<any>
  {
    const field: FieldOptions = this.fieldOptions[entityName][fieldName]

    if (field.type === FieldType.Column) {
      return new ColumnProcessor(this.conventions)
    }
    this.checkTarget(entityName, fieldName, field.options)
    switch (field.type) {
      case FieldType.ManyHasMany:
        return new ManyHasManyProcessor(this.conventions)
      case FieldType.OneHasOne:
        return new OneHasOneProcessor(this.conventions)
      case FieldType.OneHasMany:
        return new OneHasManyProcessor(this.conventions)
      case FieldType.ManyHasOne:
        return new ManyHasOneProcessor(this.conventions)
    }

    throw new Error()
  }


  private checkTarget(entityName: string, fieldName: string, options: { target: string })
  {
    if (!this.entities[options.target]) {
      throw new SchemaBuilderError(`${entityName}::${fieldName}: undefined target entity ${options.target}`)
    }
  }

  private registerField(entityName: string, field: Column | AnyRelation)
  {
    if (!this.entities[entityName]) {
      throw new SchemaBuilderError(`Undefined entity ${entityName}`)
    }
    if (this.entities[entityName].fields[field.name]) {
      throw new SchemaBuilderError(`${entityName}: Field ${field.name} is already defined`)
    }
    this.entities[entityName].fields[field.name] = field
  }


  private getPrimaryFieldName(entityOptions: EntityOptions, entityName: string, fields: FieldOptionsMap)
  {
    let primary: string[] = []
    if (entityOptions.primary) {
      primary.push(entityOptions.primary)
    }
    for (let name in fields) {
      const field: FieldOptions = fields[name]
      if (field.type !== FieldType.Column) {
        continue
      }
      if (!field.options.primary) {
        continue
      }
      if (!primary.includes(name)) {
        primary.push(name)
      }

    }
    if (primary.length > 1) {
      throw new SchemaBuilderError(`${entityName}: Only single column can be a primary. Found: ${primary.join(', ')}`)
    }
    return primary.length === 1 ? primary[0] : this.conventions.getPrimaryField()
  }

  private createDefaultPrimary(fieldName: string): FieldOptions
  {
    return {
      type: FieldType.Column,
      options: {
        nullable: false,
        type: "uuid",
        primary: true,
      },
    }
  }

  private createUnique(options: EntityOptions, fieldOptions: FieldOptionsMap): Array<{ fields: string[], name: string }>
  {
    const unique = (options.unique || []).map(it => ({fields: it.fields, name: it.name || it.fields.join('_')}))
    for (let fieldName in fieldOptions) {
      let options = fieldOptions[fieldName]
      if (options.type === FieldType.Column && options.options.unique) {
        unique.push({fields: [fieldName], name: fieldName})
      } else if (options.type === FieldType.OneHasOne) {
        unique.push(({fields: [fieldName], name: fieldName}))
      }
    }
    return unique
  }
}
