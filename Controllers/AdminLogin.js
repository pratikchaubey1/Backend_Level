const jwt = require('jsonwebtoken');

// Simple admin login using hardcoded credentials.
// username: admin, password: admin13
const adminLogin = (req, res) => {
  try {
    const { username, password } = req.body;

    if (username !== 'admin' || password !== 'admin13') {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials',
      });
    }

    const payload = {
      role: 'admin',
      username: 'admin',
    };

    const token = jwt.sign(payload, process.env.Prab_key, {
      expiresIn: '10d',
    });

    return res.status(200).json({
      success: true,
      message: 'Admin login success',
      token,
      payload,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { adminLogin };
