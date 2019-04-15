import chalk from 'chalk'

const texts = ['[DEPRECATED]', '   [SUCCESS]', '     [DEBUG]']

export const deprecated = (message: string) => {
	return chalk.bgYellow.white(texts[0]) + ' ' + message
}

export const success = (message: string) => {
	return chalk.bgGreen.black(texts[1]) + ' ' + message
}

export const debug = (message: string) => {
	return chalk.bgWhite.black(texts[2]) + ' ' + message
}
