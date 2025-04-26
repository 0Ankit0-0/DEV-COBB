"use strict";

var express = require("express");

var mongoose = require("mongoose");

var cors = require("cors");

var http = require("http");

var socketIo = require("socket.io");

var dotenv = require("dotenv");

var path = require("path");

dotenv.config();

var authRoutes = require("./routes/auth.routes");

var projectRoutes = require("./routes/project.routes");

var aiRoutes = require("./routes/ai.routes");

var ratingsRoutes = require("./routes/ratings.routes");

var friendsRoutes = require("./routes/friends.routes"); // Added missing import


var socketHandler = require("./socket");

var app = express();
var server = http.createServer(app);
var io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/dev-cobb", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(function () {
  return console.log("Connected to MongoDB");
})["catch"](function (err) {
  return console.error("MongoDB connection error:", err);
});
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/projects", ratingsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/friends", friendsRoutes); // Added friends routes

socketHandler(io); // User routes

app.get("/api/users/:userId", function _callee(req, res) {
  var user;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return regeneratorRuntime.awrap(require("./models/User").findById(req.params.userId).select("name email username avatar bio website location friends"));

        case 3:
          user = _context.sent;

          if (user) {
            _context.next = 6;
            break;
          }

          return _context.abrupt("return", res.status(404).json({
            success: false,
            message: "User not found"
          }));

        case 6:
          res.status(200).json({
            success: true,
            user: user
          });
          _context.next = 13;
          break;

        case 9:
          _context.prev = 9;
          _context.t0 = _context["catch"](0);
          console.error(_context.t0);
          res.status(500).json({
            success: false,
            message: "Server error"
          });

        case 13:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 9]]);
}); // Endpoint to get user's friends

app.get("/api/users/:userId/friends", function _callee2(req, res) {
  var user;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _context2.next = 3;
          return regeneratorRuntime.awrap(require("./models/User").findById(req.params.userId).populate("friends", "name email username avatar"));

        case 3:
          user = _context2.sent;

          if (user) {
            _context2.next = 6;
            break;
          }

          return _context2.abrupt("return", res.status(404).json({
            success: false,
            message: "User not found"
          }));

        case 6:
          res.status(200).json({
            success: true,
            count: user.friends.length,
            friends: user.friends
          });
          _context2.next = 13;
          break;

        case 9:
          _context2.prev = 9;
          _context2.t0 = _context2["catch"](0);
          console.error(_context2.t0);
          res.status(500).json({
            success: false,
            message: "Server error"
          });

        case 13:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 9]]);
});

if (process.env.NODE_ENV === "production") {
  app.use(express["static"](path.join(__dirname, "../frontend/build")));
  app.get("*", function (req, res) {
    res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
  });
}

var PORT = process.env.PORT || 5001;
server.listen(PORT, function () {
  console.log("Server running on port ".concat(PORT));
});