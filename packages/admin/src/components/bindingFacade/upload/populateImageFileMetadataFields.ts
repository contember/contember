import { EntityAccessor } from '@contember/binding'
import { DesugaredImageFileUploadProps } from './ImageFileUploadProps'

export const populateImageFileMetadataFields = (
	parentEntity: EntityAccessor,
	image: HTMLImageElement,
	props: DesugaredImageFileUploadProps,
) =>
	parentEntity.batchUpdates(getAccessor => {
		if (props.heightField) {
			getAccessor()
				.getRelativeSingleField<number>(props.heightField)
				.updateValue?.(image.naturalHeight)
		}
		if (props.widthField) {
			getAccessor()
				.getRelativeSingleField<number>(props.widthField)
				.updateValue?.(image.naturalWidth)
		}
	})
