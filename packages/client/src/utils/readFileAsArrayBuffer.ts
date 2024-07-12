export const readFileAsArrayBuffer = (file: File): Promise<string | ArrayBuffer> =>
	new Promise((resolve, reject) => {
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
