const prisma = require("../../../prisma/client");

exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        middleName: true,
        phoneNumber: true,
        isEmailVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        UserEntityLink: {
          select: {
            id: true,
            entityType: true,
            entityId: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
    });
  }
};
