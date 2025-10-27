const { ApolloServer } = require("@apollo/server");
const { gql } = require("graphql-tag");

// ============================================================================
// GRAPHQL SCHEMA DEFINITION
// ============================================================================

const typeDefs = gql`
  type Query {
    # Basic queries
    hello: String!
    health: HealthStatus!
    version: String!
    
    # System info
    serverInfo: ServerInfo!
  }

  type Mutation {
    # Basic mutations
    ping(message: String!): PingResponse!
  }
  
  type HealthStatus {
    status: String!
    timestamp: String!
    uptime: Float!
  }
  
  type ServerInfo {
    version: String!
    environment: String!
    uptime: Float!
    timestamp: String!
  }
  
  type PingResponse {
    message: String!
    timestamp: String!
  }
`;

// ============================================================================
// GRAPHQL RESOLVERS
// ============================================================================

const resolvers = {
  Query: {
    hello: () => "Hello from CareDevi GraphQL API! 🚀",
    
    health: () => ({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }),
    
    version: () => "1.0.0",
    
    serverInfo: () => ({
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }),
  },
  
  Mutation: {
    ping: (_, { message }) => ({
      message: `Pong: ${message}`,
      timestamp: new Date().toISOString(),
    }),
  },
};

// ============================================================================
// APOLLO SERVER SETUP
// ============================================================================

async function createApolloServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== "production",
    
    // Custom plugins
    plugins: [
      // Request logging plugin
      {
        requestDidStart() {
          return {
            didResolveOperation(requestContext) {
              const operationName = requestContext.request.operationName || "Anonymous";
              console.log(`🔗 GraphQL operation: ${operationName}`);
            },
            didEncounterErrors(requestContext) {
              console.error("❌ GraphQL errors:", requestContext.errors);
            },
          };
        },
      },
    ],
    
    // Error formatting
    formatError: (err) => {
      console.error("GraphQL Error:", err);
      
      // Don't expose internal errors in production
      if (process.env.NODE_ENV === "production") {
        return {
          message: "Internal server error",
          code: "INTERNAL_ERROR",
        };
      }
      
      return err;
    },
  });

  await server.start();
  return server;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

function createContext({ req }) {
  return {
    // User context (for authentication)
    user: req.user || null,
    
    // Request headers
    headers: req.headers,
    
    // Request metadata
    timestamp: new Date().toISOString(),
    requestId: req.headers["x-request-id"] || Math.random().toString(36).substr(2, 9),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  createApolloServer,
  createContext,
};
