import { AnyRelation, Column } from "../../model"

interface FieldProcessor<O>
{
  process(entityName: string, fieldName: string, options: O, registerField: FieldProcessor.FieldRegistrar): void
}

namespace FieldProcessor
{
  export type FieldRegistrar = (entityName: string, field: Column | AnyRelation) => void
}

export default FieldProcessor
