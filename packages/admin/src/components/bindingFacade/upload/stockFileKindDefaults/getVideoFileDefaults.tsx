import { BindingError, SugaredFieldProps } from '@contember/binding'
import * as React from 'react'
import { VideoFieldView } from '../../fieldViews'
import { noFileUrlMessage } from './noFileUrlMessage'
import { StockFileKindDefault } from './StockFileKindDefault'

export const getVideoFileDefaults = (fileUrlField: SugaredFieldProps['field'] | undefined): StockFileKindDefault => ({
	accept: 'video/*',
	renderFile: () => {
		if (fileUrlField === undefined) {
			if (__DEV_MODE__) {
				throw new BindingError(noFileUrlMessage)
			} else {
				return null
			}
		}
		return <VideoFieldView srcField={fileUrlField} />
	},
	renderFilePreview: (file, previewUrl) => <video src={previewUrl} controls />,
})
