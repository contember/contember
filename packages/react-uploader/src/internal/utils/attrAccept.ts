/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Andrey Okonetchnikov
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
export function attrAccept(file: File, acceptedFiles: string | string[] | null): boolean {
	if (acceptedFiles === null || acceptedFiles === '*' || acceptedFiles === '*/*') {
		return true
	}
	const acceptedFilesArray = Array.isArray(acceptedFiles) ? acceptedFiles : acceptedFiles.split(',')
	const fileName = file.name || ''
	const mimeType = (file.type || '').toLowerCase()
	const baseMimeType = mimeType.replace(/\/.*$/, '')

	return acceptedFilesArray.some(type => {
		const validType = type.trim().toLowerCase()
		if (validType.charAt(0) === '.') {
			return fileName.toLowerCase().endsWith(validType)
		} else if (validType.endsWith('/*')) {
			// This is something like a image/* mime type
			return baseMimeType === validType.replace(/\/.*$/, '')
		}
		return mimeType === validType
	})
}
