import { BindingError, SugaredFieldProps } from '@contember/binding'
import * as React from 'react'
import { ImageFieldView } from '../../fieldViews'
import { noFileUrlMessage } from './noFileUrlMessage'
import { StockFileKindDefault } from './StockFileKindDefault'

export const getImageFileDefaults = (fileUrlField: SugaredFieldProps['field'] | undefined): StockFileKindDefault => ({
	accept: 'image/*',
	renderFile: () => {
		if (fileUrlField === undefined) {
			if (__DEV_MODE__) {
				throw new BindingError(noFileUrlMessage)
			} else {
				return null
			}
		}
		return <ImageFieldView srcField={fileUrlField} />
	},
	renderFilePreview: (file, previewUrl) => <img src={previewUrl} />,
})
