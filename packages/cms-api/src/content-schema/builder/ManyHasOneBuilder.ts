import { JoiningColumn, OnDelete } from "../model"
import FieldBuilder from "./FieldBuilder"

type PartialOptions<K extends keyof ManyHasOneBuilder.Options> = Partial<ManyHasOneBuilder.Options> & Pick<ManyHasOneBuilder.Options, K>

class ManyHasOneBuilder<O extends PartialOptions<never> = PartialOptions<never>> implements FieldBuilder<O>
{
  private options: O

  constructor(options: O)
  {
    this.options = {
      ...(options as object),
    } as O
  }

  target(target: string): ManyHasOneBuilder<O & PartialOptions<'target'>>
  {
    return new ManyHasOneBuilder<O & PartialOptions<'target'>>({...(this.options as object), target} as O & PartialOptions<'target'>)
  }

  inversedBy(inversedBy: string): ManyHasOneBuilder<O>
  {
    return new ManyHasOneBuilder<O>({...(this.options as object), inversedBy} as O)
  }

  joiningColumn(columnName: string): ManyHasOneBuilder<O>
  {
    return new ManyHasOneBuilder<O>({...(this.options as object), joiningColumn: {...this.options.joiningColumn, columnName}} as O)
  }

  onDelete(onDelete: OnDelete): ManyHasOneBuilder<O>
  {
    return new ManyHasOneBuilder<O>({...(this.options as object), joiningColumn: {...this.options.joiningColumn, onDelete}} as O)
  }

  notNull(): ManyHasOneBuilder<O>
  {
    return new ManyHasOneBuilder<O>({...(this.options as object), nullable: false} as O)
  }


  getOption(): O
  {
    return this.options
  }
}

namespace ManyHasOneBuilder
{
  export type Options = {
    target: string
    inversedBy?: string
    joiningColumn?: Partial<JoiningColumn>
    nullable?: boolean
  }
}

export default ManyHasOneBuilder
