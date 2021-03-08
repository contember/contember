export class MigrationVersionHelper {
	public static prefixLength = 'YYYY-MM-DD-HHIISS'.length

	public static extractVersion(filename: string): string {
		return filename.substring(0, this.prefixLength)
	}

	public static createVersion(name: string, increment: number = 0): [string, string] {
		const normalizedName = MigrationVersionHelper.normalizeMigrationLabel(name)
		const version = MigrationVersionHelper.createTimePrefix(increment)
		return [version, `${version}-${normalizedName}`]
	}

	public static extractName(filename: string): string {
		return filename.substring(0, filename.lastIndexOf('.'))
	}

	private static createTimePrefix(increment: number): string {
		const now = new Date()
		now.setSeconds(now.getSeconds() + increment)
		const year = now.getFullYear()
		const month = (now.getMonth() + 1).toString().padStart(2, '0')
		const day = now //
			.getDate()
			.toString()
			.padStart(2, '0')
		const hours = now //
			.getHours()
			.toString()
			.padStart(2, '0')
		const minutes = now //
			.getMinutes()
			.toString()
			.padStart(2, '0')
		const seconds = now //
			.getSeconds()
			.toString()
			.padStart(2, '0')

		return `${year}-${month}-${day}-${hours}${minutes}${seconds}`
	}

	private static normalizeMigrationLabel(name: string) {
		return name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
	}
}
