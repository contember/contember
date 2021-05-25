import type { SugaredDiscriminateBy } from '../../discrimination'
import type { SingleFileUploadProps } from '../core'

export type DiscriminatedFileUploadProps = SingleFileUploadProps & {
	discriminateBy?: SugaredDiscriminateBy
	accept: string | string[] | undefined
}
