import { useObjectMemo } from '@contember/react-utils'
import { useMemo } from 'react'
import { CommonFileKindProps, FullFileKind } from '../fileKinds'
import { isEmptyByUrlField, SingleKindFileHandler } from './SingleKindFileHandler'

type UseSingleKindFileHandlerProps<AcceptArtifacts> =
	& CommonFileKindProps<AcceptArtifacts>

export const useSingleKindFileHandler = <AcceptArtifacts, T extends UseSingleKindFileHandlerProps<AcceptArtifacts>>
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
