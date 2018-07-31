import OneHasOneBuilder from "../OneHasOneBuilder"
import FieldProcessor from "./FieldProcessor"
import { JoiningColumn, OnDelete, OneHasOneInversedRelation, OneHasOneOwnerRelation, RelationType } from "../../model"
import NamingConventions from "../NamingConventions";

export default class OneHasOneProcessor implements FieldProcessor<OneHasOneBuilder.Options>
{
  private conventions: NamingConventions

  constructor(conventions: NamingConventions)
  {
    this.conventions = conventions
  }

  public process(entityName: string, fieldName: string, options: OneHasOneBuilder.Options, registerField: FieldProcessor.FieldRegistrar): void
  {
    registerField(entityName, this.createOneHasOneOwner(options, fieldName))
    if (options.inversedBy) {
      registerField(options.target, this.createOneHasOneInversed(options as OneHasOneBuilder.Options & { inversedBy: string }, entityName, fieldName))
    }
  }

  private createOneHasOneInversed(options: OneHasOneBuilder.Options & { inversedBy: string }, entityName: string, fieldName: string): OneHasOneInversedRelation
  {
    return {
      name: options.inversedBy,
      ownedBy: fieldName,
      target: entityName,
      relation: RelationType.OneHasOne,
      nullable: options.inversedNullable || true,
    }
  }

  private createOneHasOneOwner(options: OneHasOneBuilder.Options, fieldName: string): OneHasOneOwnerRelation
  {
    const joiningColumn: Partial<JoiningColumn> = options.joiningColumn || {}

    return {
      name: fieldName,
      inversedBy: options.inversedBy,
      nullable: options.nullable || true,
      relation: RelationType.OneHasOne,
      target: options.target,
      joiningColumn: {
        columnName: joiningColumn.columnName || this.conventions.getJoiningColumnName(fieldName),
        onDelete: joiningColumn.onDelete || OnDelete.restrict,
      },
    }
  }
}
