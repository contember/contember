import { useContext } from 'react'
import { I18nContext } from './I18nContext'
import { I18nError } from './I18nError'

export const useI18n = () => {
	const i18n = useContext(I18nContext)

	if (i18n === undefined) {
		throw new I18nError(`Failed to use I18n because the I18nProvider wasn't initialized.`)
	}
	return i18n
}
