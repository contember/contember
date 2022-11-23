import { GraphQLEnumType, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql'

export const S3Header = new GraphQLObjectType({
	name: 'S3Header',
	fields: {
		key: { type: new GraphQLNonNull(GraphQLString) },
		value: { type: new GraphQLNonNull(GraphQLString) },
	},
})

export const createS3SignedRead = ({ allowedKeyPatterns }: { allowedKeyPatterns: string[] }) => new GraphQLObjectType({
	name: 'S3SignedRead',
	fields: {
		url: { type: new GraphQLNonNull(GraphQLString) },
		headers: {
			type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(S3Header))),
		},
		method: { type: new GraphQLNonNull(GraphQLString) },
		objectKey: {
			type: new GraphQLNonNull(GraphQLString),
			description: `Allowed patterns:\n${allowedKeyPatterns.join('\n')}`,
		},
		bucket: { type: new GraphQLNonNull(GraphQLString) },
	},
})

export const createS3SignedUpload = ({ allowedKeyPatterns }: { allowedKeyPatterns: string[] }) => new GraphQLObjectType({
	name: 'S3SignedUpload',
	fields: {
		url: { type: new GraphQLNonNull(GraphQLString) },
		headers: {
			type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(S3Header))),
		},
		method: { type: new GraphQLNonNull(GraphQLString) },
		objectKey: {
			type: new GraphQLNonNull(GraphQLString),
			description: `Allowed patterns:\n${allowedKeyPatterns.join('\n')}`,
		},
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
