import { BindingError, SugaredFieldProps } from '@contember/binding'
import * as React from 'react'
import { FileUrlFieldView } from '../../fieldViews'
import { noFileUrlMessage } from './noFileUrlMessage'
import { StockFileKindDefault } from './StockFileKindDefault'

export const getAudioFileDefaults = (fileUrlField: SugaredFieldProps['field'] | undefined): StockFileKindDefault => ({
	accept: 'audio/*',
	renderFile: () => {
		if (fileUrlField === undefined) {
			if (__DEV_MODE__) {
				throw new BindingError(noFileUrlMessage)
			} else {
				return null
			}
		}
		return <FileUrlFieldView fileUrlField={fileUrlField} /> // TODO
	},
	renderFilePreview: (file, previewUrl) => <audio src={previewUrl} controls />,
})
