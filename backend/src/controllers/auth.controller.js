const { loginAdmin } = require("../services/auth.service");

async function postLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email và mật khẩu là bắt buộc",
      });
    }

    const session = loginAdmin({ email, password });
    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res) {
  res.json({
    success: true,
    data: {
      user: req.admin,
    },
  });
}

module.exports = {
  getMe,
  postLogin,
};
