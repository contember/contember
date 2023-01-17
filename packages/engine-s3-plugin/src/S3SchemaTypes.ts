import {
	GraphQLEnumType,
	GraphQLInputObjectType,
	GraphQLInt,
	GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLString,
} from 'graphql'

export const S3Header = new GraphQLObjectType({
	name: 'S3Header',
	fields: {
		key: { type: new GraphQLNonNull(GraphQLString) },
		value: { type: new GraphQLNonNull(GraphQLString) },
	},
})

export const S3ContentDisposition = new GraphQLEnumType({
	name: 'S33ContentDisposition', values: {
		ATTACHMENT: {},
		INLINE: {},
	},
})
export type S3ContentDisposition = 'ATTACHMENT' | 'INLINE'

export const S3SignedRead = new GraphQLObjectType({
	name: 'S3SignedRead',
	fields: {
		url: { type: new GraphQLNonNull(GraphQLString) },
		headers: {
			type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(S3Header))),
		},
		method: { type: new GraphQLNonNull(GraphQLString) },
		objectKey: { type: new GraphQLNonNull(GraphQLString) },
		bucket: { type: new GraphQLNonNull(GraphQLString) },
	},
})

export const S3SignedUpload = new GraphQLObjectType({
	name: 'S3SignedUpload',
	fields: {
		url: { type: new GraphQLNonNull(GraphQLString) },
		headers: {
			type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(S3Header))),
		},
		method: { type: new GraphQLNonNull(GraphQLString) },
		objectKey: { type: new GraphQLNonNull(GraphQLString) },
		bucket: { type: new GraphQLNonNull(GraphQLString) },
		publicUrl: { type: new GraphQLNonNull(GraphQLString) },
	},
})

export const S3Acl = new GraphQLEnumType({
	name: 'S3Acl',
	values: {
		PUBLIC_READ: {},
		PRIVATE: {},
		NONE: {},
	},
})

export type S3Acl = 'PUBLIC_READ' | 'PRIVATE' | 'NONE'

export const S3GenerateSignedUploadInput = new GraphQLInputObjectType({
	name: 'S3GenerateSignedUploadInput',
	fields: {
		contentType: { type: GraphQLString },
		extension: { type: GraphQLString, description: 'If not provided, extension is detected from a content-type.' },
		expiration: { type: GraphQLInt, description: 'Signed URL expiration.' },
		size: { type: GraphQLInt, description: 'Uploaded file size. Required when you enable ACL size limits.' },
		prefix: { type: GraphQLString, description: 'Can be used as a "directory".' },
		suffix: { type: GraphQLString, description: 'Suffix after generated id and before the extension.' },
		fileName: { type: GraphQLString, description: 'This only affects Content-disposition header. Does not affect actual object key.' },
		contentDisposition: { type: S3ContentDisposition },
		acl: { type: S3Acl, description: 'If not supported by S3 provider, an error is thrown.' },
	},
})
export interface S3GenerateSignedUploadInput {
	contentType: null | string
	extension: null | string
	expiration: null | number
	size: null | number
	prefix: null | string
	suffix: null | string
	fileName: null | string
	contentDisposition: null | S3ContentDisposition
	acl: null | S3Acl
}
