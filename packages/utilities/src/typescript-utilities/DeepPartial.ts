export type DeepPartial<T> = T extends Function
	? T
	: T extends Array<infer InferredArrayMember>
	? Array<DeepPartial<InferredArrayMember>>
	: T extends object
	? { [Key in keyof T]?: DeepPartial<T[Key]> }
	: T | undefined;
