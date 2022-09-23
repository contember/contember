import { LogEntry, LoggerAttributes } from './types'
import { inspect } from 'node:util'

export type FormattedAttributes = {
	formattedAttributes: Record<string, string>
	formattedLine: string
}

export const formatLoggerAttributes = (parentAttributes: FormattedAttributes | undefined, ownAttributes: LoggerAttributes): FormattedAttributes => {
	const formattedAttributes: Record<string, string> = {}
	let formattedLine = ''
	for (const key in ownAttributes) {
		const formattedKey = stringify(key)
		const value = ownAttributes[key]
		if (value === undefined) {
			continue
		}
		const formattedValue = stringify(value)
		formattedAttributes[formattedKey] = formattedValue
		formattedLine += `, ${formattedKey}: ${formattedValue}`
	}
	const parentFormattedAttributes = parentAttributes?.formattedAttributes
	for (const key in parentFormattedAttributes) {
		if (!(key in formattedAttributes)) {
			const formattedValue = parentFormattedAttributes[key]
			formattedAttributes[key] = formattedValue
			formattedLine += `, ${key}: ${formattedValue}`
		}
	}
	return { formattedAttributes, formattedLine }
}

export const formatLogEntryAttributes = (attributes: FormattedAttributes, entry: LogEntry): string => {
	let entryAttributes = ''
	let reformatRest = false
	const omitInRest: Record<string, boolean> = {}

	for (const key in entry.ownAttributes) {
		const formattedKey = stringify(key)
		const value = entry.ownAttributes[key]
		if (value === undefined) {
			continue
		}
		const formattedValue = stringify(value)
		entryAttributes += `, ${formattedKey}: ${formattedValue}`
		if (key in attributes.formattedAttributes) {
			reformatRest = true
			omitInRest[formattedKey] = true
		}
	}
	if (reformatRest) {
		for (const key in attributes.formattedAttributes) {
			if (!(key in omitInRest)) {
				entryAttributes += `, ${key}: ${attributes.formattedAttributes[key]}`
			}
		}
	} else {
		entryAttributes += attributes.formattedLine
	}

	return entryAttributes
}

export const stringify = (value: unknown) => {
	try {
		return JSON.stringify(value)
	} catch {
		return JSON.stringify(inspect(value))
	}
}
