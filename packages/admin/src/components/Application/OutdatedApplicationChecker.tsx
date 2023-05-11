import { useIsMounted } from '@contember/react-utils'
import { Button, Heading, Stack, useDialog } from '@contember/ui'
import { ComponentType, useCallback, useEffect, useRef, useState } from 'react'
import { useMessageFormatter } from '../../i18n'
import { outdatedApplicationDictionary } from './outdatedApplicationDictionary'

const postponeTimeoutMs = 60_000 * 5
const checkIntervalMs = 30_000

/**
 * @internal
 */
export const OutdatedApplicationChecker: ComponentType = () => {
	const modal = useDialog<boolean>()
	const isOutdated = useIsOutdated()
	const isOpen = useRef(false)
	const isMounted = useIsMounted()

	const openDialog = useCallback(async () => {
		if (isOpen.current || !isMounted.current) {
			return
		}
		isOpen.current = true

		const result = await modal.openDialog({
			content: ({ resolve }) => (
				<OutdatedApplicationDialog onReload={() => resolve(true)} onPostpone={() => resolve(false)} />
			),
		})
		isOpen.current = false

		if (!isMounted.current) {
			return
		}
		if (result) {
			window.location.reload()
		} else {
			setTimeout(openDialog, postponeTimeoutMs)
		}
	}, [isMounted, modal])

	useEffect(() => {
		if (!isOutdated) {
			return
		}
		openDialog()
	}, [isOutdated, openDialog])

	return null
}

const OutdatedApplicationDialog = ({ onReload, onPostpone }: { onReload: () => void, onPostpone: () => void }) => {
	const formatMessage = useMessageFormatter(outdatedApplicationDictionary)
	return (
		<Stack direction={'vertical'}>
			<Heading>{formatMessage('outdatedApplication.heading')}</Heading>
			<p>{formatMessage('outdatedApplication.text')}</p>
			<Stack direction={'horizontal'} gap={'small'} justify={'end'}>
				<Button onClick={onReload} intent={'success'}>
					{formatMessage('outdatedApplication.reloadButton')}
				</Button>
				<Button onClick={onPostpone} intent={'warn'}>
					{formatMessage('outdatedApplication.postponeButton')}
				</Button>
			</Stack>
		</Stack>
	)
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

const useIsOutdated = () => {
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
	}, [checkVersion, shouldCheck])

	useEffect(() => {
		if (!shouldCheck) {
			return
		}
		document.addEventListener('visibilitychange', checkVersion)
		return () => document.removeEventListener('visibilitychange', checkVersion)
	}, [checkVersion, shouldCheck])

	return isOutdated
}
