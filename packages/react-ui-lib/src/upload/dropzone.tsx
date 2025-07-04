import { UploaderDropzoneArea, UploaderDropzoneRoot } from '@contember/react-uploader-dropzone'
import { useUploaderStateFiles } from '@contember/react-uploader'
import { UploaderDropzoneAreaUI, UploaderDropzoneWrapperUI, UploaderInactiveDropzoneUI } from './ui'
import { ReactNode } from 'react'
import { UploadIcon } from 'lucide-react'
import { dict } from '../dict'
import { Button } from '../ui/button'

/**
* Props for {@link UploaderDropzone}
*/
export type UploaderDropzoneProps = {
	/**
	 * Custom placeholder content for the dropzone area.
	 */
	dropzonePlaceholder?: ReactNode
	/**
	 * Whether the dropzone should be inactive when uploads are in progress.
	 */
	inactiveOnUpload?: boolean
}

/**
 * Props {@link UploaderDropzoneProps}
 *
 * `UploaderDropzone` renders a file drop area UI for uploading files, with optional
 * placeholder customization and conditional display of a loader while uploads are in progress.
 *
 * Requires usage within an uploader context providing file upload state.
 *
 * - Displays a loader when uploads are active and `inactiveOnUpload` is `true`
 * - Supports custom placeholder content via `dropzonePlaceholder`
 *
 * #### Example: Basic usage with custom placeholder
 * ```tsx
 * <UploaderDropzone
 *   inactiveOnUpload
 *   dropzonePlaceholder={<div>Drop files here or click to upload</div>}
 * />
 * ```
 */
export const UploaderDropzone = ({ inactiveOnUpload, dropzonePlaceholder }: UploaderDropzoneProps) => {
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
