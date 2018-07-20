import { AnyRelation, Column } from "../../model"

export type FieldRegistrar = (entityName: string, field: Column | AnyRelation) => void

export interface FieldProcessor<O>
{
  process(entityName: string, fieldName: string, options: O, registerField: FieldRegistrar): void
}
