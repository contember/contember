import { ErrorMessageFactory } from './ErrorMessageFactory'

export interface ChildrenAnalyzerOptions<Environment = any> {
	ignoreRenderProps: boolean
	renderPropsErrorMessage: ErrorMessageFactory<Environment>

	ignoreUnhandledNodes: boolean
	unhandledNodeErrorMessage: ErrorMessageFactory<Environment>

	environmentFactoryName: string
	syntheticChildrenFactoryName: string
}
