import { BindingError, SugaredFieldProps } from '@contember/binding'
import { FileUrlFieldView } from '../../fieldViews'
import { noFileUrlMessage } from './noFileUrlMessage'
import type { StockFileKindDefault } from './StockFileKindDefault'

export const getGenericFileDefaults = (fileUrlField: SugaredFieldProps['field'] | undefined): StockFileKindDefault => ({
	accept: '',
	renderFile: () => {
		if (fileUrlField === undefined) {
			if (__DEV_MODE__) {
				throw new BindingError(noFileUrlMessage)
			} else {
				return null
			}
		}
		return <FileUrlFieldView fileUrlField={fileUrlField} />
	},
	renderFilePreview: (file, previewUrl) => (
		<a
			style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', direction: 'rtl' }}
			href={previewUrl}
			onClick={e => e.stopPropagation()}
			download
		>
			{previewUrl.substring(Math.max(0, previewUrl.lastIndexOf('/') + 1))}
		</a>
	),
})
