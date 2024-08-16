import * as React from 'react'
import { UploaderDropzoneArea, UploaderDropzoneRoot } from '@contember/react-uploader-dropzone'
import { useUploaderStateFiles } from '@contember/react-uploader'
import { UploaderDropzoneAreaUI, UploaderDropzoneWrapperUI, UploaderInactiveDropzoneUI } from './ui'
import { ReactNode } from 'react'
import { UploadIcon } from 'lucide-react'
import { dict } from '../dict'
import { Button } from '../ui/button'


export const UploaderDropzone = ({ inactiveOnUpload, dropzonePlaceholder }: { inactiveOnUpload?: boolean; dropzonePlaceholder?: ReactNode }) => {
	const filesInProgress = useUploaderStateFiles({ state: ['uploading', 'initial', 'finalizing'] })
	const showLoader = inactiveOnUpload && filesInProgress.length > 0

	return (
		<UploaderDropzoneRoot>
			<UploaderDropzoneWrapperUI>
				{showLoader
					? <UploaderInactiveDropzoneUI />
					: <UploaderDropzoneArea>{dropzonePlaceholder ?? <UploaderDropzoneAreaUI>
						<UploadIcon className={'w-12 h-12 text-gray-400'} />
						<div className={'font-semibold text-sm'}>{dict.uploader.dropFiles}</div>
						<div className={'text-xs'}>{dict.uploader.or}</div>
						<div className={'flex gap-2 items-center text-xs'}>
							<Button size={'sm'} variant={'outline'}>{dict.uploader.browseFiles}</Button>
						</div>
					</UploaderDropzoneAreaUI>}</UploaderDropzoneArea>
				}
			</UploaderDropzoneWrapperUI>
		</UploaderDropzoneRoot>
	)
}
