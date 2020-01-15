import * as React from 'react'
import { AggregateUploadProps, DesugaredAggregateUploadProps } from './AggregateUploadProps'
import { useDesugaredAudioFileUploadProps } from './useDesugaredAudioFileUploadProps'
import { useDesugaredGenericFileUploadProps } from './useDesugaredGenericFileUploadProps'
import { useDesugaredImageFileUploadProps } from './useDesugaredImageFileUploadProps'
import { useDesugaredVideoFileUploadProps } from './useDesugaredVideoFileUploadProps'

export const useDesugaredAggregateUploadProps = (props: AggregateUploadProps): DesugaredAggregateUploadProps => {
	const audioProps = useDesugaredAudioFileUploadProps(props)
	const genericProps = useDesugaredGenericFileUploadProps(props)
	const imageProps = useDesugaredImageFileUploadProps(props)
	const videoProps = useDesugaredVideoFileUploadProps(props)

	return React.useMemo(
		() => ({
			...audioProps,
			...genericProps,
			...imageProps,
			...videoProps,
		}),
		[audioProps, genericProps, imageProps, videoProps],
	)
}
