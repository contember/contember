import { EntityAccessor, getRelativeSingleField } from '@contember/binding'
import { DesugaredImageFileUploadProps } from './ImageFileUploadProps'

export const populateImageFileMetadataFields = (
	parentEntity: EntityAccessor,
	image: HTMLImageElement,
	props: DesugaredImageFileUploadProps,
) =>
	parentEntity.batchUpdates?.(getAccessor => {
		if (props.heightField) {
			getRelativeSingleField<number>(getAccessor(), props.heightField).updateValue?.(image.naturalHeight)
		}
		if (props.widthField) {
			getRelativeSingleField<number>(getAccessor(), props.widthField).updateValue?.(image.naturalWidth)
		}
	})
