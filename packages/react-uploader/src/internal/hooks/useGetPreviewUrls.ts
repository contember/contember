import { useCallback, useEffect, useRef } from 'react'

export const useGetPreviewUrls = () => {
	const previewUrls = useRef(new Set<string>())
	useEffect(() => {
		const urls = previewUrls.current
		return () => {
			for (const url of Array.from(urls)) {
				URL.revokeObjectURL(url)
			}
		}
	}, [])

	return useCallback((file: File) => {
		const previewUrl = URL.createObjectURL(file)
		previewUrls.current.add(previewUrl)
		return previewUrl
	}, [])
}


