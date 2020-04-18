import { CustomFileKindProps } from './CustomFileKindProps'
import { DiscriminatedFileUploadProps } from './DiscriminatedFileUploadProps'
import { StockFileKindProps } from './StockFileKindProps'

export type ResolvableFileKindProps = CustomFileKindProps | StockFileKindProps

export const useResolvedFileKinds = (props: ResolvableFileKindProps): DiscriminatedFileUploadProps[] => {
	if ('fileKinds' in props) {
		return Array.from(props.fileKinds)
	}
	return []
}
