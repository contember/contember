import { Model } from 'cms-common'

interface FieldProcessor<O> {
	process(entityName: string, fieldName: string, options: O, registerField: FieldProcessor.FieldRegistrar): void
}

namespace FieldProcessor {
	export type FieldRegistrar = (entityName: string, field: Model.AnyField) => void
}

export default FieldProcessor
