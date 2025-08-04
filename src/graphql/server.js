const { ApolloServer } = require("@apollo/server");
const typeDefs = require("./typeDefs");
const resolvers = require("./resolvers");
const createContext = require("./context");

const createApolloServer = () => {
  return new ApolloServer({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== "production",
    formatError: (formattedError, error) => {
      console.error("GraphQL Error:", error);

      if (
        process.env.NODE_ENV === "production" &&
        !formattedError.message.startsWith("Authentication") &&
        !formattedError.message.startsWith("Validation") &&
        !formattedError.message.startsWith("Forbidden")
      ) {
        return new Error("Internal server error");
      }

      return formattedError;
    },
    plugins: [
      {
        requestDidStart() {
          return {
            didResolveOperation(requestContext) {
              console.log(
                `GraphQL Operation: ${
                  requestContext.request.operationName || "Anonymous"
                }`
              );
            },
            didEncounterErrors(requestContext) {
              console.error("GraphQL errors:", requestContext.errors);
            },
          };
        },
      },
    ],
  });
};

module.exports = { createApolloServer, createContext };
