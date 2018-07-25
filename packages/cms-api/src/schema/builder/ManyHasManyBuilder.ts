import { JoiningTable } from "../model"
import FieldBuilder from "./FieldBuilder"

type PartialOptions<K extends keyof ManyHasManyBuilder.Options> = Partial<ManyHasManyBuilder.Options> & Pick<ManyHasManyBuilder.Options, K>

class ManyHasManyBuilder<O extends PartialOptions<never> = PartialOptions<never>> implements FieldBuilder<O>
{
  private options: O

  constructor(options: O)
  {
    this.options = {
      ...(options as object),
    } as O
  }

  target(target: string): ManyHasManyBuilder<O & PartialOptions<'target'>>
  {
    return new ManyHasManyBuilder<O & PartialOptions<'target'>>({
      ...(this.options as object),
      target
    } as O & PartialOptions<'target'>)
  }

  inversedBy(inversedBy: string): ManyHasManyBuilder<O>
  {
    return new ManyHasManyBuilder<O>({...(this.options as object), inversedBy} as O)
  }

  joiningTable(joiningTable: JoiningTable): ManyHasManyBuilder<O>
  {
    return new ManyHasManyBuilder<O>({...(this.options as object), joiningTable} as O)
  }

  getOption(): O
  {
    return this.options
  }
}

namespace ManyHasManyBuilder
{
  export type Options = {
    target: string
    inversedBy?: string
    joiningTable?: JoiningTable
  }
}

export default ManyHasManyBuilder
