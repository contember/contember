export interface JsExecutor {
	execute(code: string): Promise<unknown>
}
