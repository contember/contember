import { JoiningColumn, OnDelete } from "../model"
import FieldBuilder from "./FieldBuilder"

type PartialOptions<K extends keyof OneHasManyBuilder.Options> = Partial<OneHasManyBuilder.Options> & Pick<OneHasManyBuilder.Options, K>


class OneHasManyBuilder<O extends PartialOptions<never> = PartialOptions<never>> implements FieldBuilder<O>
{
  private options: O

  constructor(options: O)
  {
    this.options = {
      ...(options as object),
    } as O
  }

  target(target: string): OneHasManyBuilder<O & PartialOptions<'target'>>
  {
    return new OneHasManyBuilder<O & PartialOptions<'target'>>({...(this.options as object), target} as O & PartialOptions<'target'>)
  }

  ownedBy(ownedBy: string): OneHasManyBuilder<O>
  {
    return new OneHasManyBuilder<O>({...(this.options as object), ownedBy} as O)
  }

  ownerJoiningColumn(columnName: string): OneHasManyBuilder<O>
  {
    return new OneHasManyBuilder<O>({...(this.options as object), ownerJoiningColumn: {...this.options.ownerJoiningColumn, columnName}} as O)
  }

  onDelete(onDelete: OnDelete): OneHasManyBuilder<O>
  {
    return new OneHasManyBuilder<O>({...(this.options as object), ownerJoiningColumn: {...this.options.ownerJoiningColumn, onDelete}} as O)
  }

  ownerNotNull(): OneHasManyBuilder<O>
  {
    return new OneHasManyBuilder<O>({...(this.options as object), ownerNullable: false} as O)
  }

  ownerNullable(): OneHasManyBuilder<O>
  {
    return new OneHasManyBuilder<O>({...(this.options as object), ownerNullable: true} as O)
  }

  getOption(): O
  {
    return this.options
  }
}

namespace OneHasManyBuilder
{
  export type Options = {
    target: string
    ownedBy?: string
    ownerJoiningColumn?: Partial<JoiningColumn>
    ownerNullable?: boolean
  }
}

export default OneHasManyBuilder
