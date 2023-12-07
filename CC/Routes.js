  require("dotenv").config();
  var express = require("express");
  var routes = express.Router();
  const jwt = require("jsonwebtoken");
  const { Login } = require("./Auth/Login");
  const { Register } = require("./Auth/Register");
  const { DeleteUsers } = require("./Delete");
  const { ConfirmEmail } = require("./Auth/ConfirmEmail");g
  const { ForgotPassword } = require("./Auth/ForgotPassword");
  const { Authorization } = require("./Middleware/Authorization");
  const { CustomerControllers } = require('./HomeCustomers/CustomerControllers');
  const { SellerControllers } = require('./HomeUMKM/SellerControllers');
  routes.get("/", (req, res) => {
    return 'Unauthorized Access';
  });

  // Auth Routes
  routes.post('/api/auth/login', Login);
  routes.post('/api/auth/register', Register);
  routes.post('/api/auth/confirm', ConfirmEmail);
  routes.post('/api/auth/forgotpassword', ForgotPassword);

  // Customers Page Routes 
  routes.get('/api/customers', CustomerControllers.getAllCustomers);
  routes.get('/api/customers/:id', CustomerControllers.getCustomerById);

  // Sellers Pages Route
  routes.get('/api/sellers', SellerControllers.getAllSellers);
  routes.get('/api/sellers/:id', SellerControllers.getSellerById);
  routes.post('/api/sellers/setstatustoko', Customer);

  // Product Routes
  routes.get('/api/product', Customer);
  routes.get('/api/product/:id', Customer);
  routes.post('/api/product', Customer);  
  routes.put('/api/product', Customer);

  // Settings Routes
  routes.put('/api/settings/changedetails', ForgotPassword);
  routes.put('/api/settings/changepassword', ForgotPassword);
  routes.post('/api/settings/', ForgotPassword);

  // Notification Routes
  routes.get('/api/notifications/:id', Notification);
  routes.get('/api/notifications/details/:id', Notification);

  // Transaction Routes
  routes.post('/api/transactions/', Transaction);
  routes.get('/api/transactions/:id', Transaction);
  routes.get('/api/transactions/details/:id', Transaction);

  // Review Routes
  // Middleware Route
  routes.post('/api/middleware/authorization', Authorization);
  routes.delete('/cleanup', DeleteUsers);

  module.exports = routes;
