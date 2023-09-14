import type { Environment } from '@contember/react-binding'
import { HasOne } from '@contember/react-binding'
import { Fragment, ReactElement, ReactNode } from 'react'
import { FullFileKind } from '../../fileKinds'

export const staticRenderFileKind = (fileKind: FullFileKind, environment: Environment): [upload: ReactElement, children: ReactNode] => {
	const children = (
		<>
			{!fileKind.baseEntity || !fileKind.childrenOutsideBaseEntity ? fileKind.children : null}
			{fileKind.renderUploadedFile}
			{fileKind.extractors.map((extractor, i) => (
				<Fragment key={i}>{extractor.staticRender({ environment })}</Fragment>
			))}
		</>
	)
	return [
		fileKind.baseEntity === undefined
			? children
			: <HasOne field={fileKind.baseEntity}>{children}</HasOne>,
		fileKind.childrenOutsideBaseEntity ? fileKind.children : null,
	]
}
