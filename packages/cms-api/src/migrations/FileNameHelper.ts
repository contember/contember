import { zeroPad } from '../utils/zeroPad'

class FileNameHelper {
	public static createFileName(name: string, extension: string): string {
		return `${FileNameHelper.createTimePrefix()}-${name}.${extension}`
	}

	private static createTimePrefix(): string {
		const now = new Date()
		const year = now.getFullYear()
		const month = zeroPad(now.getMonth() + 1, 2)
		const day = zeroPad(now.getDate(), 2)
		const hours = zeroPad(now.getHours(), 2)
		const minutes = zeroPad(now.getMinutes(), 2)
		const seconds = zeroPad(now.getSeconds(), 2)

		return `${year}-${month}-${day}-${hours}${minutes}${seconds}`
	}
}

export default FileNameHelper
