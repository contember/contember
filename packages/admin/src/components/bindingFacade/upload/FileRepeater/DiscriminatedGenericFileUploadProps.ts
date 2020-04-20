import { Scalar } from '@contember/binding'
import { SugaredDiscriminateBy } from '../../blocks'
import { SingleFileUploadProps } from '../core'

export type DiscriminatedGenericFileUploadProps = SingleFileUploadProps & {
	accept?: string | string[]
} & (
		| {
				discriminateGenericBy?: SugaredDiscriminateBy
		  }
		| {
				discriminateGenericByScalar?: Scalar
		  }
	)
