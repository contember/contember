import { useMemo } from 'react'
import { useObjectMemo } from '@contember/react-utils'
import { isEmptyByUrlField, SingleKindFileHandler } from './SingleKindFileHandler'
import { CommonFileKindProps } from '../fileKinds'
import { FullFileKind } from '../fileKinds'

type UseSingleKindFileHandlerProps<AcceptArtifacts extends unknown> =
	& CommonFileKindProps<AcceptArtifacts>

export const useSingleKindFileHandler = <AcceptArtifacts extends unknown, T extends UseSingleKindFileHandlerProps<AcceptArtifacts>>
	(props: T, kindFactory: (params: T) => FullFileKind) => {
		const stableProps = useObjectMemo(props)
		return useMemo(
			() => new SingleKindFileHandler(
				kindFactory(stableProps),
				isEmptyByUrlField(stableProps.urlField),
			),
			[kindFactory, stableProps],
		)
}
