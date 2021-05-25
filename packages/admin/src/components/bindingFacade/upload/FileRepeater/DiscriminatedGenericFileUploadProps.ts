import type { SugaredDiscriminateBy } from '../../discrimination'
import type { SingleFileUploadProps } from '../core'

export type DiscriminatedGenericFileUploadProps = SingleFileUploadProps & {
	accept?: string | string[]
	discriminateGenericBy?: SugaredDiscriminateBy
}
