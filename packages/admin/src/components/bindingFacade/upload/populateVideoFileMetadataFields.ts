import { EntityAccessor } from '@contember/binding'
import { DesugaredVideoFileUploadProps } from './VideoFileUploadProps'

export const populateVideoFileMetadataFields = (
	parentEntity: EntityAccessor,
	video: HTMLVideoElement,
	props: DesugaredVideoFileUploadProps,
) =>
	parentEntity.batchUpdates?.(getAccessor => {
		if (props.durationField) {
			getAccessor()
				.getRelativeSingleField<number>(props.durationField)
				.updateValue?.(video.duration)
		}
		if (props.heightField) {
			getAccessor()
				.getRelativeSingleField<number>(props.heightField)
				.updateValue?.(video.videoHeight)
		}
		if (props.widthField) {
			getAccessor()
				.getRelativeSingleField<number>(props.widthField)
				.updateValue?.(video.videoWidth)
		}
	})
