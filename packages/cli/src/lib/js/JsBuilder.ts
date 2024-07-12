export interface JsBuilder {
	build(path: string): Promise<string>
}
