import { useOptionalDesugaredRelativeSingleField } from '@contember/binding'
import * as React from 'react'
import { DesugaredAudioFileUploadProps, AudioFileUploadProps } from './AudioFileUploadProps'

export const useDesugaredAudioFileUploadProps = (props: AudioFileUploadProps): DesugaredAudioFileUploadProps => {
	const durationField = useOptionalDesugaredRelativeSingleField(props.durationField)

	return React.useMemo(
		() => ({
			durationField,
		}),
		[durationField],
	)
}
