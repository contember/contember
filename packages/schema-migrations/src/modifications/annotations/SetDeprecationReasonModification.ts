import { createAnnotationModification } from './GenericAnnotationModification.js'

const { handler, differ, modification } = createAnnotationModification({
	id: 'setDeprecationReason',
	annotationField: 'deprecationReason',
	displayName: 'deprecation reason',
})

export const SetDeprecationReasonModificationHandler = handler
export const SetDeprecationReasonDiffer = differ
export const setDeprecationReasonModification = modification
