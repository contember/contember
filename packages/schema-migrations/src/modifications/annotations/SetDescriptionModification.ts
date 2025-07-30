import { createAnnotationModification } from './GenericAnnotationModification'

const { handler, differ, modification } = createAnnotationModification({
	id: 'setDescription',
	annotationField: 'description' as const,
	displayName: 'description',
})

export const SetDescriptionModificationHandler = handler
export const SetDescriptionDiffer = differ
export const setDescriptionModification = modification

export interface SetDescriptionModificationData {
	entityName: string
	fieldName?: string
	description?: string
}
