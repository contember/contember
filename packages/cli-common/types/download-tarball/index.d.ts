declare module 'download-tarball' {
	export default function downloadTarball(args: {
		url: string
		dir: string
		gotOpts?: { headers?: Record<string, any> }
	}): Promise<void>
}
