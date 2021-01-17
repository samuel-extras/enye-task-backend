// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require("express");
const axios = require("axios");
const moment = require("moment");
const app = express();

/**
 * Parse body as json
 */
app.use(express.json());

/**
 * App error class
 * A simple wrapper around the vanilla Error class
 * for more flexibility over error handling
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Automatically catches any error thrown in route handler (handlers wrapped with it)
 * P.S it forwards the error directly to the global error handler for proper handling
 */
const errorCatcher = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Checks for a field or fields in the request query  and if not found skip to the global error handler
 */
const requireUrlParams = (...fields) => (req, res, next) => {
  let hasMissingField = null;
  fields.forEach(field => {
    if (!(field in req.query)) {
      hasMissingField = field;
    }
  });

  if (hasMissingField)
    return next(
      new AppError(
        `Invalid query param - property ${hasMissingField} is required`
      )
    );

  next();
};

/**
 * ==============================
 * Route handlers
 * ==============================
 */

/**
 * Handles get request to the root url of the server
 */
const handleGet = (req, res) => {
  res.json({
    status: "success",
    data: {
      fullname: "Samuel Oluwasegun Ajibola",
      profession: "Software Engineer",
      greeting: "Hello, I am Samuel",
      email: "samuel88783.so@gmail.com",
      phone: "09033728282"
    }
  });
};

/**
 * Handles get request to api/rates
 */
const handleRateGet = async (req, res, next) => {
  const { base, currency } = req.query;
  const date = moment().format("YYYY-MM-DD");

  const { data } = await axios.get(
    `https://api.exchangeratesapi.io/latest?base=${base}&symbols=${currency}`
  );

  res.status(200).json({
    status: "success",
    results: {
      base,
      date,
      rates: data.rates
    }
  });
};

/**
 * Handles all error thrown or delegated from and in the app
 */
const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || "error";
  const message = err.message || "Something went horribly wrong!";

  return res.status(statusCode).json({ status, message });
};

/**
 * This router handler is only reached if the url doesnt match any of the above
 * Which means the route hasn't been implemented (aka not found, aka doesn't exist)
 */
const handleNotFound = (req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server. Try a get or post request to ${req.hostname}`
  });
};

/**
 * =================================
 * Routing - all routing in the app to an handler (aka controller) is done here
 * =================================
 */
app.get("/", handleGet);
app.get(
  "/api/rates",
  requireUrlParams("base", "currency"),
  errorCatcher(handleRateGet)
);
app.use(globalErrorHandler);
app.all("*", handleNotFound);

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
