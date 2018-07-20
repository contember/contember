import { JoiningTable } from "../model"
import { FieldBuilder } from "./FieldConfigurator"

type PartialOptions<K extends keyof ManyHasManyRelationOptions> = Partial<ManyHasManyRelationOptions> & Pick<ManyHasManyRelationOptions, K>


export type ManyHasManyRelationOptions = {
  target: string
  inversedBy?: string
  joiningTable?: JoiningTable
}

export class ManyHasManyRelationBuilder<O extends PartialOptions<never> = PartialOptions<never>> implements FieldBuilder<O>
{
  private options: O

  constructor(options: O)
  {
    this.options = {
      ...(options as object),
    } as O
  }

  target(target: string): ManyHasManyRelationBuilder<O & PartialOptions<'target'>>
  {
    return new ManyHasManyRelationBuilder<O & PartialOptions<'target'>>({
      ...(this.options as object),
      target
    } as O & PartialOptions<'target'>)
  }

  inversedBy(inversedBy: string): ManyHasManyRelationBuilder<O>
  {
    return new ManyHasManyRelationBuilder<O>({...(this.options as object), inversedBy} as O)
  }

  joiningTable(joiningTable: JoiningTable): ManyHasManyRelationBuilder<O>
  {
    return new ManyHasManyRelationBuilder<O>({...(this.options as object), joiningTable} as O)
  }

  getOption(): O
  {
    return this.options
  }
}
