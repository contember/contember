import { createAnnotationModification } from './GenericAnnotationModification.js'

const { handler, differ, modification } = createAnnotationModification({
	id: 'setDescription',
	annotationField: 'description',
	displayName: 'description',
})

export const SetDescriptionModificationHandler = handler
export const SetDescriptionDiffer = differ
export const setDescriptionModification = modification
