import FieldProcessor from "./FieldProcessor"
import ManyHasManyBuilder from "../ManyHasManyBuilder"
import { JoiningTable, ManyHasManyInversedRelation, ManyHasManyOwnerRelation, OnDelete, RelationType } from "../../model"
import NamingConventions from "../NamingConventions";

export default class ManyHasManyProcessor implements FieldProcessor<ManyHasManyBuilder.Options>
{
  private conventions: NamingConventions

  constructor(conventions: NamingConventions)
  {
    this.conventions = conventions
  }

  public process(entityName: string, fieldName: string, options: ManyHasManyBuilder.Options, registerField: FieldProcessor.FieldRegistrar): void
  {
    registerField(entityName, this.createManyHasManyOwner(options, entityName, fieldName))
    if (options.inversedBy) {
      registerField(options.target, this.createManyHasManyInversed(options.inversedBy, entityName, fieldName))
    }
  }

  private createManyHasManyInversed(
    inversedBy: string,
    entityName: string,
    fieldName: string
  ): ManyHasManyInversedRelation
  {
    return {
      name: inversedBy,
      ownedBy: fieldName,
      target: entityName,
      relation: RelationType.ManyHasMany,
    }
  }

  private createManyHasManyOwner(options: ManyHasManyBuilder.Options, entityName: string, fieldName: string): ManyHasManyOwnerRelation
  {
    let joiningTable: JoiningTable | undefined = options.joiningTable
    if (!joiningTable) {
      const columnNames = this.conventions.getJoiningTableColumnNames(entityName, fieldName, options.target, options.inversedBy)
      joiningTable = {
        tableName: this.conventions.getJoiningTableName(entityName, fieldName),
        joiningColumn: {columnName: columnNames[0], onDelete: OnDelete.cascade},
        inverseJoiningColumn: {columnName: columnNames[1], onDelete: OnDelete.cascade},
      }
    }

    return {
      relation: RelationType.ManyHasMany,
      name: fieldName,
      inversedBy: options.inversedBy,
      target: options.target,
      joiningTable: joiningTable
    }
  }
}
