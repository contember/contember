import { EntityAccessor, getRelativeSingleField } from '@contember/binding'
import { DesugaredAudioFileUploadProps } from './AudioFileUploadProps'

export const populateAudioFileMetadataFields = (
	parentEntity: EntityAccessor,
	audio: HTMLAudioElement,
	props: DesugaredAudioFileUploadProps,
) =>
	parentEntity.batchUpdates?.(getAccessor => {
		if (props.durationField) {
			getRelativeSingleField<number>(getAccessor(), props.durationField).updateValue?.(audio.duration)
		}
	})
