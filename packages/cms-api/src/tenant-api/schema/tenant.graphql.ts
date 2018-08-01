import {gql} from 'apollo-server-express'
import {DocumentNode} from "graphql"

const schema: DocumentNode = gql`
  schema {
    query: Query
    mutation: Mutation
  }

  type Query {
    me: Person!
  }

  type Mutation {
    signUp(email: String!, password: String!): SignUpResponse
    signIn(email: String!, password: String!): SignInResponse
    addProjectMember(projectId: String!, personId: String!): AddProjectMemberResponse 
  }

  # === signUp ===
  type SignUpResponse {
      ok: Boolean!
      errors: [SignUpError!]!
      result: SignUpResult
  }
  
  type SignUpError {
      code: SignUpErrorCode!
      endPersonMessage: String
      developerMessage: String
  }
  
  enum SignUpErrorCode {
      EMAIL_ALREADY_EXISTS
  }
  
  type SignUpResult {
      person: Person!
  }

  # === signIn ===
  type SignInResponse {
    ok: Boolean!
    errors: [SignInError!]!
    result: SignInResult
  }

  type SignInError {
    code: SignInErrorCode!
    endUserMessage: String
    developerMessage: String
  }

  enum SignInErrorCode {
    UNKNOWN_EMAIL
    INVALID_PASSWORD
  }

  type SignInResult {
    token: String!
    person: Person!
  }

  # === addProjectMember ===
  type AddProjectMemberResponse {
    ok: Boolean!
    errors: [AddProjectMemberError!]!
  }

  type AddProjectMemberError {
    code: AddProjectMemberErrorCode!
    endUserMessage: String
    developerMessage: String
  }
  
  enum AddProjectMemberErrorCode {
    PROJECT_NOT_FOUND
    PERSON_NOT_FOUND
    ALREADY_MEMBER
  }

  # === common ===
  type Person {
    id: String!
    email: String!
    projects: [Project!]!
  }

  type Project {
    id: String!
    name: String!
  }
`

export default schema
