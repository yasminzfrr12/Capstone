var express = require("express");
var app = express();
var routes = require("./Routes"); 
const bodyParser = require("body-parser");
const { Limiter } = require("./Middleware/Limiter");
require("dotenv").config();

app.use(bodyParser.json());
app.use(Limiter);
app.use(routes);
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

const server = app.listen(3000, () => {
  console.log("listening on port 3000");
});

server.timeout = 60000;
