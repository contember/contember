import { EntityAccessor, getRelativeSingleField } from '@contember/binding'
import { DesugaredVideoFileUploadProps } from './VideoFileUploadProps'

export const populateVideoFileMetadataFields = (
	parentEntity: EntityAccessor,
	video: HTMLVideoElement,
	props: DesugaredVideoFileUploadProps,
) =>
	parentEntity.batchUpdates?.(getAccessor => {
		if (props.durationField) {
			getRelativeSingleField<number>(getAccessor(), props.durationField).updateValue?.(video.duration)
		}
		if (props.heightField) {
			getRelativeSingleField<number>(getAccessor(), props.heightField).updateValue?.(video.videoHeight)
		}
		if (props.widthField) {
			getRelativeSingleField<number>(getAccessor(), props.widthField).updateValue?.(video.videoWidth)
		}
	})
