export enum SchemaKnownColumnType {
	Bool = 'Bool',
	Date = 'Date',
	DateTime = 'DateTime',
	Double = 'Double',
	Enum = 'Enum',
	Int = 'Integer',
	String = 'String',
	Uuid = 'Uuid',
}
export type SchemaColumnType = SchemaKnownColumnType | string
