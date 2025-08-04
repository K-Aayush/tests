const { gql } = require("graphql-tag");

const typeDefs = gql`
  enum AdministrativeGender {
    male
    female
    other
    unknown
  }

  enum ContactPointSystem {
    phone
    fax
    email
    sms
  }

  enum AddressType {
    postal
    physical
    both
  }

  enum AddressUse {
    home
    work
    temp
    old
    billing
  }

  enum IdentifierUse {
    usual
    official
    temp
    secondary
    old
  }

  type Identifier {
    id: ID!
    use: IdentifierUse
    system: String
    value: String!
    type: String
    createdAt: String!
    updatedAt: String!
  }

  type Address {
    id: ID!
    use: AddressUse
    type: AddressType
    text: String
    line: [String!]!
    city: String
    state: String
    postalCode: String
    country: String
    createdAt: String!
    updatedAt: String!
  }

  type Patient {
    id: ID!
    identifier: [Identifier!]!
    active: Boolean!
    firstName: String!
    middleName: String
    lastName: String!
    preferredName: String
    contactPointType: ContactPointSystem
    contactPointValue: String
    gender: AdministrativeGender
    birthDate: String
    deceased: Boolean
    address: [Address!]!
    maritalStatus: String
    empi: String
    generalPractitioner: String
    createdAt: String!
    updatedAt: String!
  }

  type PaginationInfo {
    page: Int!
    limit: Int!
    total: Int!
    pages: Int!
  }

  type PatientsResponse {
    patients: [Patient!]!
    pagination: PaginationInfo!
  }

  input IdentifierInput {
    use: IdentifierUse
    system: String
    value: String!
    type: String
  }

  input AddressInput {
    use: AddressUse
    type: AddressType
    text: String
    line: [String!]
    city: String
    state: String
    postalCode: String
    country: String
  }

  input CreatePatientInput {
    identifier: [IdentifierInput!]
    active: Boolean
    firstName: String!
    middleName: String
    lastName: String!
    preferredName: String
    contactPointType: ContactPointSystem
    contactPointValue: String
    gender: AdministrativeGender
    birthDate: String
    deceased: Boolean
    address: [AddressInput!]
    maritalStatus: String
    empi: String
    generalPractitioner: String
  }

  input UpdatePatientInput {
    identifier: [IdentifierInput!]
    active: Boolean
    firstName: String
    middleName: String
    lastName: String
    preferredName: String
    contactPointType: ContactPointSystem
    contactPointValue: String
    gender: AdministrativeGender
    birthDate: String
    deceased: Boolean
    address: [AddressInput!]
    maritalStatus: String
    empi: String
    generalPractitioner: String
  }

  input PatientFilters {
    active: Boolean
    gender: AdministrativeGender
    search: String
  }

  type Query {
    patient(id: ID!): Patient
    patients(page: Int, limit: Int, filters: PatientFilters): PatientsResponse!
  }

  type Mutation {
    createPatient(input: CreatePatientInput!): Patient!
    updatePatient(id: ID!, input: UpdatePatientInput!): Patient!
    deletePatient(id: ID!): Boolean!
  }
`;

module.exports = typeDefs;
