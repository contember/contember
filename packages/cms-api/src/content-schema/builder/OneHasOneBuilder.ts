import { JoiningColumn, OnDelete } from "../model"
import FieldBuilder from "./FieldBuilder"

type PartialOptions<K extends keyof OneHasOneBuilder.Options> = Partial<OneHasOneBuilder.Options> & Pick<OneHasOneBuilder.Options, K>

class OneHasOneBuilder<O extends PartialOptions<never> = PartialOptions<never>> implements FieldBuilder<O>
{
  private options: O

  constructor(options: O)
  {
    this.options = {
      ...(options as object),
    } as O
  }

  target(target: string): OneHasOneBuilder<O & PartialOptions<'target'>>
  {
    return new OneHasOneBuilder<O & PartialOptions<'target'>>({...(this.options as object), target} as O & PartialOptions<'target'>)
  }

  inversedBy(inversedBy: string): OneHasOneBuilder<O>
  {
    return new OneHasOneBuilder<O>({...(this.options as object), inversedBy} as O)
  }

  joiningColumn(columnName: string): OneHasOneBuilder<O>
  {
    return new OneHasOneBuilder<O>({...(this.options as object), joiningColumn: {...this.options.joiningColumn, columnName}} as O)
  }

  onDelete(onDelete: OnDelete): OneHasOneBuilder<O>
  {
    return new OneHasOneBuilder<O>({...(this.options as object), joiningColumn: {...this.options.joiningColumn, onDelete}} as O)
  }

  notNull(): OneHasOneBuilder<O>
  {
    return new OneHasOneBuilder<O>({...(this.options as object), nullable: false} as O)
  }

  inversedNotNull(): OneHasOneBuilder<O>
  {
    return new OneHasOneBuilder<O>({...(this.options as object), inversedNullable: false} as O)
  }

  getOption(): O
  {
    return this.options
  }
}

namespace OneHasOneBuilder
{
  export type Options = {
    target: string
    inversedBy?: string
    joiningColumn?: Partial<JoiningColumn>
    nullable?: boolean
    inversedNullable?: boolean
  }
}


export default OneHasOneBuilder
