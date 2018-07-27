import FieldProcessor from "./FieldProcessor"
import ColumnBuilder from "../ColumnBuilder"
import NamingConventions from "../NamingConventions";

export default class ColumnProcessor implements FieldProcessor<ColumnBuilder.Options>
{
  private conventions: NamingConventions

  constructor(conventions: NamingConventions)
  {
    this.conventions = conventions
  }

  public process(entityName: string, fieldName: string, options: ColumnBuilder.Options, registerField: FieldProcessor.FieldRegistrar): void
  {
    registerField(entityName, {
      columnName: options.columnName || this.conventions.getColumnName(fieldName),
      type: options.type,
      nullable: options.nullable === undefined ? true : options.nullable,
      name: fieldName,
    })
  }
}
