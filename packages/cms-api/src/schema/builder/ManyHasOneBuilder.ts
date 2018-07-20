import { JoiningColumn, OnDelete } from "../model"
import { FieldBuilder } from "./FieldConfigurator"

type PartialOptions<K extends keyof ManyHasOneRelationOptions> = Partial<ManyHasOneRelationOptions> & Pick<ManyHasOneRelationOptions, K>

export type ManyHasOneRelationOptions = {
  target: string
  inversedBy?: string
  joiningColumn?: Partial<JoiningColumn>
  nullable?: boolean
}

export class ManyHasOneRelationBuilder<O extends PartialOptions<never> = PartialOptions<never>> implements FieldBuilder<O>
{
  private options: O

  constructor(options: O)
  {
    this.options = {
      ...(options as object),
    } as O
  }

  target(target: string): ManyHasOneRelationBuilder<O & PartialOptions<'target'>>
  {
    return new ManyHasOneRelationBuilder<O & PartialOptions<'target'>>({...(this.options as object), target} as O & PartialOptions<'target'>)
  }

  inversedBy(inversedBy: string): ManyHasOneRelationBuilder<O>
  {
    return new ManyHasOneRelationBuilder<O>({...(this.options as object), inversedBy} as O)
  }

  joiningColumn(columnName: string): ManyHasOneRelationBuilder<O>
  {
    return new ManyHasOneRelationBuilder<O>({...(this.options as object), joiningColumn: {...this.options.joiningColumn, columnName}} as O)
  }

  onDelete(onDelete: OnDelete): ManyHasOneRelationBuilder<O>
  {
    return new ManyHasOneRelationBuilder<O>({...(this.options as object), joiningColumn: {...this.options.joiningColumn, onDelete}} as O)
  }

  notNull(): ManyHasOneRelationBuilder<O>
  {
    return new ManyHasOneRelationBuilder<O>({...(this.options as object), nullable: false} as O)
  }


  getOption(): O
  {
    return this.options
  }
}
