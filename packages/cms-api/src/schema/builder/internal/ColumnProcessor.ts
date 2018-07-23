import { FieldProcessor, FieldRegistrar } from "./FieldProcessor"
import { ColumnOptions } from "../ColumnBuilder"
import { NamingConventions } from "../NamingConventions";

export default class ColumnProcessor implements FieldProcessor<ColumnOptions>
{
  private conventions: NamingConventions

  constructor(conventions: NamingConventions)
  {
    this.conventions = conventions
  }

  public process(entityName: string, fieldName: string, options: ColumnOptions, registerField: FieldRegistrar): void
  {
    registerField(entityName, {
      columnName: options.columnName || this.conventions.getColumnName(fieldName),
      type: options.type,
      nullable: options.nullable || true,
      name: fieldName,
    })
  }
}
