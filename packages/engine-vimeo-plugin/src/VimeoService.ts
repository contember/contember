import { VimeoConfig } from './Config'
import fetch from 'node-fetch'

export class VimeoService {
	constructor(public readonly config: VimeoConfig) {}

	public async getUploadUrl(
		filesize: number,
	): Promise<{
		ok: boolean
		errors: { code: number; endUserMessage: string; developerMessage: string }[]
		result?: { uploadUrl: string; vimeoId: string }
	}> {
		const authorizationHeader = 'Bearer ' + this.config.token

		const response = await fetch('https://api.vimeo.com/me/videos?fields=uri,name,upload', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: authorizationHeader,
			},
			body: JSON.stringify({
				upload: {
					approach: 'tus',
					size: filesize,
				},
			}),
		})
		if (response.status !== 200) {
			const { error_code, developer_message, error } = await response.json()
			return {
				ok: false,
				errors: [
					{
						code: error_code,
						developerMessage: developer_message,
						endUserMessage: error,
					},
				],
			}
		}
		const data = await response.json()
		if (!data.uri.startsWith('/videos/')) {
			throw new Error(`Invalid vimeo response with following URI: ${data.uri}`)
		}
		const vimeoId = data.uri.substring(8)
		return { ok: true, errors: [], result: { uploadUrl: data.upload.upload_link, vimeoId } }
	}
}

export class VimeoServiceFactory {
	public create(config: VimeoConfig) {
		return new VimeoService(config)
	}
}
