import * as React from 'react'
import { UploaderDropzoneArea, UploaderDropzoneRoot } from '@contember/react-uploader-dropzone'
import { useUploaderStateFiles } from '@contember/react-uploader'
import { UploaderDropzoneAreaUI, UploaderDropzoneWrapperUI, UploaderInactiveDropzoneUI } from './ui'


export const UploaderDropzone = ({ inactiveOnUpload }: { inactiveOnUpload?: boolean }) => {
	const filesInProgress = useUploaderStateFiles({ state: ['uploading', 'initial', 'finalizing'] })
	const showLoader = inactiveOnUpload && filesInProgress.length > 0

	return (
		<UploaderDropzoneRoot>
			<UploaderDropzoneWrapperUI>
				{showLoader
					? <UploaderInactiveDropzoneUI />
					: <UploaderDropzoneArea><UploaderDropzoneAreaUI /></UploaderDropzoneArea>
				}
			</UploaderDropzoneWrapperUI>
		</UploaderDropzoneRoot>
	)
}
