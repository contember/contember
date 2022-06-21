import type { Environment } from '@contember/binding'
import { HasOne } from '@contember/binding'
import { Fragment, ReactElement } from 'react'
import { FullFileKind } from '../../fileKinds'

export const staticRenderFileKind = (fileKind: FullFileKind, environment: Environment): ReactElement => {
	const children = (
		<>
			{fileKind.children}
			{fileKind.renderUploadedFile}
			{fileKind.extractors.map((extractor, i) => (
				<Fragment key={i}>{extractor.staticRender({ environment })}</Fragment>
			))}
		</>
	)
	return fileKind.baseEntity === undefined ? children : <HasOne field={fileKind.baseEntity}>{children}</HasOne>
}
