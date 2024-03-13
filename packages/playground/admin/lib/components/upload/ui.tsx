import * as React from 'react'
import { Loader } from '../ui/loader'
import { GripIcon, GripVerticalIcon, UploadIcon } from 'lucide-react'
import { dict } from '../../dict'
import { Button } from '../ui/button'
import { uic } from '../../utils/uic'

export const UploaderDropzoneWrapperUI = uic('div', { baseClass: 'rounded border p-1 shadow' })
export const UploaderDropzoneAreaUI = uic('div', {
	baseClass: `h-40 w-40 flex flex-col gap-1 justify-center items-center py-4 border-dashed border-2 border-gray-300 rounded relative
				transition-colors
				hover:border-gray-300 hover:bg-gray-50 hover:cursor-pointer
				data-[dropzone-accept]:border-green-500  group-data-[dropzone-accept]:bg-green-100
				data-[dropzone-reject]:border-red-500 group-data-[dropzone-reject]:bg-red-100
				`,
	variants: {
		size: {
			square: 'h-40 w-40',
		},
	},
	defaultVariants: {
		size: 'square',
	},
	beforeChildren: <>
		<UploadIcon className={'w-12 h-12 text-gray-400'} />
		<div className={'font-semibold text-sm'}>{dict.uploader.dropFiles}</div>
		<div className={'text-xs'}>{dict.uploader.or}</div>
		<div className={'flex gap-2 items-center text-xs'}>
			<Button size={'sm'} variant={'outline'}>{dict.uploader.browseFiles}</Button>
		</div>
	</>,
})


export const UploaderItemUI = uic('div', {
	baseClass: 'rounded border p-1 shadow bg-gray-100  flex gap-2 relative',
})


export const UploaderInactiveDropzoneUI = uic('div', {
	baseClass: 'h-40 w-40 flex flex-col pointer-events-none relative',
	beforeChildren: <Loader position="absolute" />,
})

export const UploaderRepeaterItemsWrapperUI = uic('div', {
	baseClass: 'flex flex-wrap gap-4',
})
export const UploaderRepeaterItemUI = UploaderItemUI
export const UploaderRepeaterDragOverlayUI = uic('div', {
	baseClass: 'rounded border border-gray-300 p-4 relative bg-opacity-60 bg-gray-100 backdrop-blur-sm',
})
export const UploaderRepeaterHandleUI = uic('button', {
	baseClass: 'absolute top-0 left-0 h-6 w-6 inline-flex justify-center align-center opacity-10 hover:opacity-100 transition-opacity z-10',
	beforeChildren: <GripIcon size={16} />,
})


