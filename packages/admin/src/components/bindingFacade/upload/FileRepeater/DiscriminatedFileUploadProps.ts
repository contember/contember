import { SugaredDiscriminateBy } from '../../discrimination'
import { SingleFileUploadProps } from '../core'

export type DiscriminatedFileUploadProps = SingleFileUploadProps & {
	discriminateBy?: SugaredDiscriminateBy
	accept: string | string[] | undefined
}
