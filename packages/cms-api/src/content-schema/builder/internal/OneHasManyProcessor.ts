import FieldProcessor from "./FieldProcessor"
import OneHasManyBuilder from "../OneHasManyBuilder"
import { ManyHasOneRelation, OnDelete, OneHasManyRelation, RelationType } from "../../model"
import NamingConventions from "../NamingConventions";

export default class OneHasManyProcessor implements FieldProcessor<OneHasManyBuilder.Options>
{
  private conventions: NamingConventions

  constructor(conventions: NamingConventions)
  {
    this.conventions = conventions
  }

  process(entityName: string, fieldName: string, options: OneHasManyBuilder.Options, registerField: FieldProcessor.FieldRegistrar): void
  {
    const optionsFinalized = {
      ...options,
      ownedBy: options.ownedBy || entityName
    }
    registerField(optionsFinalized.target, this.createOwning(optionsFinalized, entityName, fieldName))
    registerField(entityName, this.createInversed(optionsFinalized, fieldName))
  }

  private createInversed(options: OneHasManyBuilder.Options & { ownedBy: string }, fieldName: string): OneHasManyRelation
  {
    return {
      name: fieldName,
      ownedBy: options.ownedBy,
      relation: RelationType.OneHasMany,
      target: options.target,
    }
  }

  private createOwning(options: OneHasManyBuilder.Options & { ownedBy: string }, entityName: string, fieldName: string): ManyHasOneRelation
  {
    const joiningColumn = options.ownerJoiningColumn || {}

    return {
      name: options.ownedBy,
      target: entityName,
      inversedBy: fieldName,
      nullable: options.ownerNullable !== undefined ? options.ownerNullable : true,
      relation: RelationType.ManyHasOne,
      joiningColumn: {
        columnName: joiningColumn.columnName || this.conventions.getJoiningColumnName(options.ownedBy),
        onDelete: joiningColumn.onDelete || OnDelete.restrict,
      },
    }
  }
}
