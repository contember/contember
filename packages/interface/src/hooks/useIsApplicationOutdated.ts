import { useCallback, useEffect, useState } from 'react'

const defaultCheckIntervalMs = 30_000


export const useIsApplicationOutdated = ({ checkIntervalMs = defaultCheckIntervalMs }: {
	checkIntervalMs?: number
} = {}) => {
	const [initialVersion] = useState(() => {
		return getVersionFromDocument(document.head)
	})
	const [isOutdated, setIsOutdated] = useState(false)
	const fetchVersion = useFetchVersion()

	const checkVersion = useCallback(async () => {
		if (document.hidden) {
			return
		}
		const version = await fetchVersion()
		if (version !== initialVersion) {
			setIsOutdated(true)
		}
	}, [fetchVersion, initialVersion])
	const shouldCheck = !!initialVersion && !isOutdated

	useEffect(() => {
		if (!shouldCheck) {
			return
		}
		const handle = setInterval(checkVersion, checkIntervalMs)
		return () => clearInterval(handle)
	}, [checkIntervalMs, checkVersion, shouldCheck])

	useEffect(() => {
		if (!shouldCheck) {
			return
		}
		document.addEventListener('visibilitychange', checkVersion)
		return () => document.removeEventListener('visibilitychange', checkVersion)
	}, [checkVersion, shouldCheck])

	return isOutdated
}

const getVersionFromDocument = (node: ParentNode) => {
	const meta = node.querySelector<HTMLMetaElement>('meta[name=contember-build-version]')
	return meta?.content
}

const useFetchVersion = () => {
	return useCallback(async () => {
		try {
			const result = await (await fetch(window.location.href)).text()
			const html = document.createElement('html')
			html.innerHTML = result
			return getVersionFromDocument(html)
		} catch (e) {
			console.error(e)
			return undefined
		}
	}, [])
}
