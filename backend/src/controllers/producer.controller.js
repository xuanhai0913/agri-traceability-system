const {
  createProducer,
  getProducerById,
  listProducers,
} = require("../services/producer.service");

function requireAdminToken(req, res, next) {
  const expectedToken = process.env.ADMIN_PRODUCER_TOKEN;
  const token = req.header("x-admin-token");

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Admin token is required",
    });
  }

  if (!expectedToken) {
    return res.status(503).json({
      success: false,
      message: "ADMIN_PRODUCER_TOKEN is not configured",
    });
  }

  if (token !== expectedToken) {
    return res.status(401).json({
      success: false,
      message: "Admin token is invalid",
    });
  }

  next();
}

async function getProducers(_req, res, next) {
  try {
    const producers = await listProducers();
    res.json({
      success: true,
      data: producers,
    });
  } catch (error) {
    next(error);
  }
}

async function getProducer(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const producer = await getProducerById(id);

    if (!producer) {
      return res.status(404).json({
        success: false,
        message: `Producer #${id} not found`,
      });
    }

    res.json({
      success: true,
      data: producer,
    });
  } catch (error) {
    next(error);
  }
}

async function postProducer(req, res, next) {
  try {
    const producer = await createProducer(req.body);
    res.status(201).json({
      success: true,
      data: producer,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProducer,
  getProducers,
  postProducer,
  requireAdminToken,
};
