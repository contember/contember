export const printProgressLine = (message: string) => {
	if (!process.stdout.clearLine) {
		return
	}
	process.stdout.clearLine(0)
	process.stdout.cursorTo(0)
	process.stdout.write(message)
}

