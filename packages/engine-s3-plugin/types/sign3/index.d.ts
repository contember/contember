declare module 'sign3' {
	type Signer = (bucket: string, key: string, expires: number, headers: Record<string, string>) => string
	export interface S3Signer {
		get: Signer
		put: Signer
	}
	export default function (url: string): S3Signer
}
