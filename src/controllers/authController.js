const { Users } = require("../models");
const { comparePassword } = require("../services/hash.service");
const { generateToken } = require("../services/jwt.service");

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await Users.findOne({ where: { username } });

    if (!user) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role,
        department: user.department,
      },
    };

    // Generate token
    const token = await generateToken(payload);

    res.json({
      id: user.id,
      username: user.username,
      department: user.department,
      roles: user.role,
      accessToken: token,
      tokenType: "Bearer",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
