import { FieldProcessor, FieldRegistrar } from "./FieldProcessor"
import { ManyHasOneRelation, OnDelete, OneHasManyRelation, RelationType } from "../../model"
import { ManyHasOneRelationOptions } from "../ManyHasOneBuilder"
import { NamingConventions } from "../NamingConventions";

export default class ManyHasOneProcessor implements FieldProcessor<ManyHasOneRelationOptions>
{
  private conventions: NamingConventions

  constructor(conventions: NamingConventions)
  {
    this.conventions = conventions
  }

  public process(entityName: string, fieldName: string, options: ManyHasOneRelationOptions, registerField: FieldRegistrar): void
  {
    registerField(entityName, this.createManyHasOneOwning(options, fieldName))
    if (options.inversedBy) {
      const inversed = this.createManyHasOneInversed(options as ManyHasOneRelationOptions & { inversedBy: string }, entityName, fieldName)
      registerField(options.target, inversed)
    }
  }


  private createManyHasOneInversed(options: ManyHasOneRelationOptions & { inversedBy: string }, entityName: string, fieldName: string): OneHasManyRelation
  {
    return {
      name: options.inversedBy,
      ownedBy: fieldName,
      target: entityName,
      relation: RelationType.OneHasMany,
    }
  }

  private createManyHasOneOwning(options: ManyHasOneRelationOptions, fieldName: string): ManyHasOneRelation
  {
    const joiningColumn = options.joiningColumn || {}
    return {
      name: fieldName,
      inversedBy: options.inversedBy,
      nullable: options.nullable || true,
      relation: RelationType.ManyHasOne,
      target: options.target,
      joiningColumn: {
        columnName: joiningColumn.columnName || this.conventions.getJoiningColumnName(fieldName),
        onDelete: joiningColumn.onDelete || OnDelete.restrict,
      },
    }
  }
}
