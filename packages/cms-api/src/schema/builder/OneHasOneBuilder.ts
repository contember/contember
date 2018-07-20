import { JoiningColumn, OnDelete } from "../model"
import { FieldBuilder } from "./FieldConfigurator"

type PartialOptions<K extends keyof OneHasOneRelationOptions> = Partial<OneHasOneRelationOptions> & Pick<OneHasOneRelationOptions, K>

export type OneHasOneRelationOptions = {
  target: string
  inversedBy?: string
  joiningColumn?: Partial<JoiningColumn>
  nullable?: boolean
  inversedNullable?: boolean
}

export class OneHasOneRelationBuilder<O extends PartialOptions<never> = PartialOptions<never>> implements FieldBuilder<O>
{
  private options: O

  constructor(options: O)
  {
    this.options = {
      ...(options as object),
    } as O
  }

  target(target: string): OneHasOneRelationBuilder<O & PartialOptions<'target'>>
  {
    return new OneHasOneRelationBuilder<O & PartialOptions<'target'>>({...(this.options as object), target} as O & PartialOptions<'target'>)
  }

  inversedBy(inversedBy: string): OneHasOneRelationBuilder<O>
  {
    return new OneHasOneRelationBuilder<O>({...(this.options as object), inversedBy} as O)
  }

  joiningColumn(columnName: string): OneHasOneRelationBuilder<O>
  {
    return new OneHasOneRelationBuilder<O>({...(this.options as object), joiningColumn: {...this.options.joiningColumn, columnName}} as O)
  }

  onDelete(onDelete: OnDelete): OneHasOneRelationBuilder<O>
  {
    return new OneHasOneRelationBuilder<O>({...(this.options as object), joiningColumn: {...this.options.joiningColumn, onDelete}} as O)
  }

  notNull(): OneHasOneRelationBuilder<O>
  {
    return new OneHasOneRelationBuilder<O>({...(this.options as object), nullable: false} as O)
  }

  inversedNotNull(): OneHasOneRelationBuilder<O>
  {
    return new OneHasOneRelationBuilder<O>({...(this.options as object), inversedNullable: false} as O)
  }

  getOption(): O
  {
    return this.options
  }
}
