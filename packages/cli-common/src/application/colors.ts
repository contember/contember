import { styleText } from 'node:util'

export type TextStyle = Exclude<Parameters<typeof styleText>[0], readonly unknown[]>

// Same detection as in @contember/logger's PrettyPrintLoggerHandler (which cannot depend on cli-common); keep them in sync.
const detectColorSupport = (): boolean => {
	const forceColor = process.env.FORCE_COLOR
	if (forceColor !== undefined) {
		return forceColor !== '0' && forceColor !== 'false'
	}
	// hasColors() honours NO_COLOR, NODE_DISABLE_COLORS and TERM=dumb; Bun's non-TTY stdout has no hasColors.
	const stdout = process.stdout
	return stdout.isTTY === true && (typeof stdout.hasColors !== 'function' || stdout.hasColors())
}

/** Whether stdout can show colors, detected once at startup. */
export const terminalSupportsColor: boolean = detectColorSupport()

let colorsEnabled = terminalSupportsColor

/** Turns colored output on or off for the whole process (`--no-color`, machine-readable modes). */
export const setColorsEnabled = (enabled: boolean): void => {
	colorsEnabled = enabled
}

export const areColorsEnabled = (): boolean => colorsEnabled

/** Styles `text` with the given styles (outermost first), or returns it unchanged when colors are off. */
export const style = (styles: TextStyle | readonly TextStyle[], text: string): string => {
	if (!colorsEnabled) {
		return text
	}
	const list: readonly TextStyle[] = typeof styles === 'string' ? [styles] : styles
	// validateStream is off because the decision above is ours; Bun ignores the option and Node < 22.13 lacks it.
	return list.reduceRight((result, current) => styleText(current, result, { validateStream: false }), text)
}
