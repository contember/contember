import { SingleFileUploadProps, UploadConfigProps } from '../core'

export interface StockFileKindDefault extends Required<SingleFileUploadProps> {
	accept: Exclude<UploadConfigProps['accept'], undefined>
}
