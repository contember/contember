import { createAnnotationModification } from './GenericAnnotationModification'

const { handler, differ, modification } = createAnnotationModification({
	id: 'setDeprecationMessage',
	annotationField: 'deprecationReason' as const,
	displayName: 'deprecation reason',
})

export const SetDeprecatedModificationHandler = handler
export const SetDeprecatedDiffer = differ
export const setDeprecatedModification = modification

export interface SetDeprecatedModificationData {
	entityName: string
	fieldName?: string
	deprecationReason?: string
}
