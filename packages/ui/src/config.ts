import { DeepPartial, NonOptional, extend } from '@contember/utilities'
import { ChevronRightIcon } from 'lucide-react'
import { StyleProviderProps } from './components'

let config = Object.freeze({
	StyleProvider: {
		displayContents: true,
		overridesLucideIcons: true,
		scheme: 'system',
		themeContent: 'default',
		themeControls: 'accent',
		transparent: true,
		suppressFocusRing: true,
	} as NonOptional<StyleProviderProps>,
	Menu: {
		caret: true,
	},
	MenuExpandToggle: {
		Icon: ChevronRightIcon,
	},
})

export function setInterfaceConfig(userConfig: DeepPartial<typeof config>) {
	config = extend(config, userConfig) as typeof config
}

export function useInterfaceConfig() {
	return config
}
