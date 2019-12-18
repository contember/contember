export function readAsDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => {
			if (typeof reader.result !== 'string') {
				reject()
				return
			}
			resolve(reader.result)
		}
		reader.readAsDataURL(file)
	})
}

export function readAsArrayBuffer(file: File): Promise<string | ArrayBuffer> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => {
			if (reader.result === null) {
				reject()
				return
			}
			resolve(reader.result)
		}
		reader.readAsArrayBuffer(file)
	})
}
