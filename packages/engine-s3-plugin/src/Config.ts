export interface S3Config {
	readonly bucket: string
	readonly region: string
	readonly prefix: string
	readonly endpoint?: string
	readonly noAcl?: boolean
	readonly credentials: {
		readonly key: string
		readonly secret: string
	}
}
