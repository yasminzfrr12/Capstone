require("dotenv").config();
var express = require("express");
var routes = express.Router();
const jwt = require("jsonwebtoken");
const { Login } = require("./Auth/Login");
const { Register } = require("./Auth/Register");
const { DeleteUsers } = require("./Delete");
const { ConfirmEmail } = require("./Auth/ConfirmEmail");
const { ForgotPassword } = require("./Auth/ForgotPassword");
const { Authorization } = require("./Middleware/Authorization");
routes.get("/", (req, res) => {
  return 'Unauthorized Access';
});
routes.post('/api/auth/login', Login);
routes.post('/api/auth/register', Register);
routes.post('/api/auth/confirm', ConfirmEmail);
routes.post('/api/auth/forgotpassword', ForgotPassword);


routes.post('/api/middleware/authorization', Authorization);
routes.delete('/cleanup', DeleteUsers);

module.exports = routes;
