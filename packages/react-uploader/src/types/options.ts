export interface UploaderOptions {
	multiple: boolean
	accept: {
		[key: string]: string[]
	} | undefined
}
