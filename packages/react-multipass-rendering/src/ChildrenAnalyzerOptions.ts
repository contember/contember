import { ErrorMessageFactory } from './ErrorMessageFactory'

export interface ChildrenAnalyzerOptions {
	ignoreRenderProps: boolean
	renderPropsErrorMessage: ErrorMessageFactory

	ignoreUnhandledNodes: boolean
	unhandledNodeErrorMessage: ErrorMessageFactory

	environmentFactoryName: string
	syntheticChildrenFactoryName: string
}
