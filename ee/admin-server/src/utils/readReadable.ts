import { Readable } from 'stream'

export const readReadable = (readable: Readable): Promise<string> => {
	return new Promise((resolve, reject) => {
		readable.once('error', reject)
		const chunks: string[] = []
		readable.on('data', it => chunks.push(it))
		readable.on('end', () => resolve(chunks.join('')))
	})
}
