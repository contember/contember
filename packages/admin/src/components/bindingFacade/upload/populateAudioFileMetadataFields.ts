import { EntityAccessor } from '@contember/binding'
import { DesugaredAudioFileUploadProps } from './AudioFileUploadProps'

export const populateAudioFileMetadataFields = (
	parentEntity: EntityAccessor,
	audio: HTMLAudioElement,
	props: DesugaredAudioFileUploadProps,
) =>
	parentEntity.batchUpdates?.(getAccessor => {
		if (props.durationField) {
			getAccessor()
				.getRelativeSingleField<number>(props.durationField)
				.updateValue?.(audio.duration)
		}
	})
