const {
  createUser,
  disableUser,
  getUserById,
  listUsers,
  loginUser,
  updateUser,
  updateUserPassword,
} = require("../services/auth.service");

async function postLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email và mật khẩu là bắt buộc",
      });
    }

    const session = await loginUser({ email, password });
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
      user: req.user,
    },
  });
}

async function getUsers(_req, res, next) {
  try {
    const users = await listUsers();
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
}

async function getUser(req, res, next) {
  try {
    const user = await getUserById(req.params.id);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

async function postUser(req, res, next) {
  try {
    const user = await createUser(req.body);
    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

async function patchUser(req, res, next) {
  try {
    const user = await updateUser(req.params.id, req.body);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error.code === "23505") {
      error.message = "Email đã tồn tại";
      error.status = 409;
    }
    next(error);
  }
}

async function patchUserDisable(req, res, next) {
  try {
    const user = await disableUser(req.params.id);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

async function patchUserPassword(req, res, next) {
  try {
    const user = await updateUserPassword(req.params.id, req.body.password);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMe,
  getUser,
  getUsers,
  patchUser,
  patchUserDisable,
  patchUserPassword,
  postLogin,
  postUser,
};
