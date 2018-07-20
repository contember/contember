import { JoiningColumn, OnDelete } from "../model"
import { FieldBuilder } from "./FieldConfigurator"

type PartialOptions<K extends keyof OneHasManyRelationOptions> = Partial<OneHasManyRelationOptions> & Pick<OneHasManyRelationOptions, K>

export type OneHasManyRelationOptions = {
  target: string
  ownedBy?: string
  ownerJoiningColumn?: Partial<JoiningColumn>
  ownerNullable?: boolean
}

export class OneHasManyRelationBuilder<O extends PartialOptions<never> = PartialOptions<never>> implements FieldBuilder<O>
{
  private options: O

  constructor(options: O)
  {
    this.options = {
      ...(options as object),
    } as O
  }

  target(target: string): OneHasManyRelationBuilder<O & PartialOptions<'target'>>
  {
    return new OneHasManyRelationBuilder<O & PartialOptions<'target'>>({...(this.options as object), target} as O & PartialOptions<'target'>)
  }

  ownedBy(ownedBy: string): OneHasManyRelationBuilder<O>
  {
    return new OneHasManyRelationBuilder<O>({...(this.options as object), ownedBy} as O)
  }

  ownerJoiningColumn(columnName: string): OneHasManyRelationBuilder<O>
  {
    return new OneHasManyRelationBuilder<O>({...(this.options as object), ownerJoiningColumn: {...this.options.ownerJoiningColumn, columnName}} as O)
  }

  onDelete(onDelete: OnDelete): OneHasManyRelationBuilder<O>
  {
    return new OneHasManyRelationBuilder<O>({...(this.options as object), ownerJoiningColumn: {...this.options.ownerJoiningColumn, onDelete}} as O)
  }

  ownerNotNull(): OneHasManyRelationBuilder<O>
  {
    return new OneHasManyRelationBuilder<O>({...(this.options as object), ownerNullable: false} as O)
  }

  ownerNullable(): OneHasManyRelationBuilder<O>
  {
    return new OneHasManyRelationBuilder<O>({...(this.options as object), ownerNullable: true} as O)
  }

  getOption(): O
  {
    return this.options
  }
}
