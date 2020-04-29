import { Scalar } from '@contember/binding'
import { SugaredDiscriminateBy } from '../../discrimination'
import { SingleFileUploadProps } from '../core'

export type DiscriminatedFileUploadProps = SingleFileUploadProps & {
	discriminateBy?: SugaredDiscriminateBy
	discriminateByScalar?: Scalar
	accept: string | string[] | undefined
}
