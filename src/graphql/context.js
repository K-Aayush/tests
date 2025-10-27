const { verifyAccessToken } = require("../config/jwt");
const prisma = require("../../prisma/client");

const createContext = async ({ req }) => {
  let user = null;

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = await verifyAccessToken(token);

      // Get user from database
      user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isEmailVerified: true,
          UserEntityLink: {
            select: {
              entityType: true,
              entityId: true,
            },
          },
        },
      });
    }
  } catch (error) {
    console.error("GraphQL context authentication error:", error.message);
  }

  return {
    user,
    prisma,
  };
};

module.exports = createContext;
