const { Users } = require("../models");
const { hashPassword } = require("../services/hash.service");

async function seedInitialData() {
  try {
    // Hash the superadmin password
    const hashedPassword = await hashPassword("123456789");

    const [user, created] = await Users.findOrCreate({
      where: { email: "admin@mail.com" },
      defaults: {
        email: "admin@mail.com",
        username: "superadmin",
        password: hashedPassword,
        role: "Admin",
        department: "Design",
      },
    });

    if (created) {
      console.log("Superadmin user created!");
    } else {
      console.log("Superadmin user already exists.");
    }
  } catch (error) {
    console.error("Error seeding data:", error);
  }
}

module.exports = seedInitialData;
