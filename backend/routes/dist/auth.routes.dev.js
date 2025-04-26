"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var express = require("express");

var router = express.Router();

var User = require("../models/User");

var Project = require("../models/Project");

var _require = require("../middleware/auth.middleware"),
    protect = _require.protect;

router.post("/register", function _callee(req, res) {
  var _req$body, name, email, password, username, user, token;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _req$body = req.body, name = _req$body.name, email = _req$body.email, password = _req$body.password, username = _req$body.username;
          console.log("Registration attempt:", {
            name: name,
            email: email,
            username: username
          }); // Add this line

          _context.next = 5;
          return regeneratorRuntime.awrap(User.findOne({
            $or: [{
              email: email
            }, {
              username: username
            }]
          }));

        case 5:
          user = _context.sent;

          if (!user) {
            _context.next = 8;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            success: false,
            message: user.email === email ? "Email already in use" : "Username already taken"
          }));

        case 8:
          _context.next = 10;
          return regeneratorRuntime.awrap(User.create({
            name: name,
            email: email,
            password: password,
            username: username || email.split("@")[0]
          }));

        case 10:
          user = _context.sent;
          token = user.getSignedJwtToken();
          res.status(201).json({
            success: true,
            token: token,
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              username: user.username
            }
          });
          _context.next = 20;
          break;

        case 15:
          _context.prev = 15;
          _context.t0 = _context["catch"](0);
          console.error("Registration error details:", _context.t0.message); // More detailed error

          console.error(_context.t0.stack); // Add stack trace

          res.status(500).json({
            success: false,
            message: "Server error: " + _context.t0.message // Include error message in response

          });

        case 20:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 15]]);
});
router.post("/login", function _callee2(req, res) {
  var _req$body2, email, password, user, isMatch, token;

  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _req$body2 = req.body, email = _req$body2.email, password = _req$body2.password;
          _context2.next = 4;
          return regeneratorRuntime.awrap(User.findOne({
            email: email
          }).select("+password"));

        case 4:
          user = _context2.sent;

          if (user) {
            _context2.next = 7;
            break;
          }

          return _context2.abrupt("return", res.status(401).json({
            success: false,
            message: "Invalid credentials"
          }));

        case 7:
          _context2.next = 9;
          return regeneratorRuntime.awrap(user.matchPassword(password));

        case 9:
          isMatch = _context2.sent;

          if (isMatch) {
            _context2.next = 12;
            break;
          }

          return _context2.abrupt("return", res.status(401).json({
            success: false,
            message: "Invalid credentials"
          }));

        case 12:
          token = user.getSignedJwtToken();
          res.status(200).json({
            success: true,
            token: token,
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              username: user.username
            }
          });
          _context2.next = 20;
          break;

        case 16:
          _context2.prev = 16;
          _context2.t0 = _context2["catch"](0);
          console.error(_context2.t0);
          res.status(500).json({
            success: false,
            message: "Server error"
          });

        case 20:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 16]]);
});
router.get("/me", protect, function _callee3(req, res) {
  var user, projectCount;
  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _context3.next = 3;
          return regeneratorRuntime.awrap(User.findById(req.user.id).select("-password").populate("friends", "name username avatar"));

        case 3:
          user = _context3.sent;
          _context3.next = 6;
          return regeneratorRuntime.awrap(Project.countDocuments({
            owner: req.user.id
          }));

        case 6:
          projectCount = _context3.sent;
          res.status(200).json({
            success: true,
            user: _objectSpread({}, user.toObject(), {
              projectCount: projectCount
            })
          });
          _context3.next = 14;
          break;

        case 10:
          _context3.prev = 10;
          _context3.t0 = _context3["catch"](0);
          console.error(_context3.t0);
          res.status(500).json({
            success: false,
            message: "Server error"
          });

        case 14:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 10]]);
});
router.put("/profile", protect, function _callee4(req, res) {
  var _req$body3, name, username, bio, website, location, avatar, updateFields, existingUser, user;

  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          _req$body3 = req.body, name = _req$body3.name, username = _req$body3.username, bio = _req$body3.bio, website = _req$body3.website, location = _req$body3.location, avatar = _req$body3.avatar;
          updateFields = {};
          if (name) updateFields.name = name;

          if (!username) {
            _context4.next = 11;
            break;
          }

          _context4.next = 7;
          return regeneratorRuntime.awrap(User.findOne({
            username: username,
            _id: {
              $ne: req.user.id
            }
          }));

        case 7:
          existingUser = _context4.sent;

          if (!existingUser) {
            _context4.next = 10;
            break;
          }

          return _context4.abrupt("return", res.status(400).json({
            success: false,
            message: "Username already taken"
          }));

        case 10:
          updateFields.username = username;

        case 11:
          if (bio !== undefined) updateFields.bio = bio;
          if (website !== undefined) updateFields.website = website;
          if (location !== undefined) updateFields.location = location;
          if (avatar !== undefined) updateFields.avatar = avatar;
          _context4.next = 17;
          return regeneratorRuntime.awrap(User.findByIdAndUpdate(req.user.id, updateFields, {
            "new": true,
            runValidators: true
          }).select("-password"));

        case 17:
          user = _context4.sent;
          res.status(200).json({
            success: true,
            user: user
          });
          _context4.next = 25;
          break;

        case 21:
          _context4.prev = 21;
          _context4.t0 = _context4["catch"](0);
          console.error(_context4.t0);
          res.status(500).json({
            success: false,
            message: "Server error"
          });

        case 25:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[0, 21]]);
});
router.get("/users", protect, function _callee5(req, res) {
  var search, query, users;
  return regeneratorRuntime.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          search = req.query.search;
          query = {};

          if (search) {
            query = {
              $or: [{
                name: {
                  $regex: search,
                  $options: "i"
                }
              }, {
                username: {
                  $regex: search,
                  $options: "i"
                }
              }],
              _id: {
                $ne: req.user.id
              }
            };
          } else {
            query = {
              _id: {
                $ne: req.user.id
              }
            };
          }

          _context5.next = 6;
          return regeneratorRuntime.awrap(User.find(query).select("name username avatar").limit(20));

        case 6:
          users = _context5.sent;
          res.status(200).json({
            success: true,
            count: users.length,
            users: users
          });
          _context5.next = 14;
          break;

        case 10:
          _context5.prev = 10;
          _context5.t0 = _context5["catch"](0);
          console.error(_context5.t0);
          res.status(500).json({
            success: false,
            message: "Server error"
          });

        case 14:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[0, 10]]);
});
router.get("/users/:id", protect, function _callee6(req, res) {
  var user, projectCount, isFriend, currentUser, hasSentFriendRequest, hasReceivedFriendRequest;
  return regeneratorRuntime.async(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          _context6.next = 3;
          return regeneratorRuntime.awrap(User.findById(req.params.id).select("-password -friendRequests -sentFriendRequests").populate("friends", "name username avatar"));

        case 3:
          user = _context6.sent;

          if (user) {
            _context6.next = 6;
            break;
          }

          return _context6.abrupt("return", res.status(404).json({
            success: false,
            message: "User not found"
          }));

        case 6:
          _context6.next = 8;
          return regeneratorRuntime.awrap(Project.countDocuments({
            owner: req.params.id
          }));

        case 8:
          projectCount = _context6.sent;
          isFriend = user.friends.some(function (friend) {
            return friend._id.toString() === req.user.id;
          });
          _context6.next = 12;
          return regeneratorRuntime.awrap(User.findById(req.user.id));

        case 12:
          currentUser = _context6.sent;
          hasSentFriendRequest = currentUser.sentFriendRequests.includes(req.params.id);
          hasReceivedFriendRequest = currentUser.friendRequests.includes(req.params.id);
          res.status(200).json({
            success: true,
            user: _objectSpread({}, user.toObject(), {
              projectCount: projectCount,
              isFriend: isFriend,
              hasSentFriendRequest: hasSentFriendRequest,
              hasReceivedFriendRequest: hasReceivedFriendRequest
            })
          });
          _context6.next = 22;
          break;

        case 18:
          _context6.prev = 18;
          _context6.t0 = _context6["catch"](0);
          console.error(_context6.t0);
          res.status(500).json({
            success: false,
            message: "Server error"
          });

        case 22:
        case "end":
          return _context6.stop();
      }
    }
  }, null, null, [[0, 18]]);
});
router.post("/friend-request/:id", protect, function _callee7(req, res) {
  var recipient, sender;
  return regeneratorRuntime.async(function _callee7$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          _context7.prev = 0;

          if (!(req.params.id === req.user.id)) {
            _context7.next = 3;
            break;
          }

          return _context7.abrupt("return", res.status(400).json({
            success: false,
            message: "You cannot send a friend request to yourself"
          }));

        case 3:
          _context7.next = 5;
          return regeneratorRuntime.awrap(User.findById(req.params.id));

        case 5:
          recipient = _context7.sent;

          if (recipient) {
            _context7.next = 8;
            break;
          }

          return _context7.abrupt("return", res.status(404).json({
            success: false,
            message: "User not found"
          }));

        case 8:
          _context7.next = 10;
          return regeneratorRuntime.awrap(User.findById(req.user.id));

        case 10:
          sender = _context7.sent;

          if (!sender.friends.includes(req.params.id)) {
            _context7.next = 13;
            break;
          }

          return _context7.abrupt("return", res.status(400).json({
            success: false,
            message: "You are already friends with this user"
          }));

        case 13:
          if (!sender.sentFriendRequests.includes(req.params.id)) {
            _context7.next = 15;
            break;
          }

          return _context7.abrupt("return", res.status(400).json({
            success: false,
            message: "Friend request already sent"
          }));

        case 15:
          recipient.friendRequests.push(req.user.id);
          _context7.next = 18;
          return regeneratorRuntime.awrap(recipient.save());

        case 18:
          sender.sentFriendRequests.push(req.params.id);
          _context7.next = 21;
          return regeneratorRuntime.awrap(sender.save());

        case 21:
          res.status(200).json({
            success: true,
            message: "Friend request sent"
          });
          _context7.next = 28;
          break;

        case 24:
          _context7.prev = 24;
          _context7.t0 = _context7["catch"](0);
          console.error(_context7.t0);
          res.status(500).json({
            success: false,
            message: "Server error"
          });

        case 28:
        case "end":
          return _context7.stop();
      }
    }
  }, null, null, [[0, 24]]);
});
router.post("/friend-request/:id/accept", protect, function _callee8(req, res) {
  var sender, recipient;
  return regeneratorRuntime.async(function _callee8$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          _context8.prev = 0;
          _context8.next = 3;
          return regeneratorRuntime.awrap(User.findById(req.params.id));

        case 3:
          sender = _context8.sent;

          if (sender) {
            _context8.next = 6;
            break;
          }

          return _context8.abrupt("return", res.status(404).json({
            success: false,
            message: "User not found"
          }));

        case 6:
          _context8.next = 8;
          return regeneratorRuntime.awrap(User.findById(req.user.id));

        case 8:
          recipient = _context8.sent;

          if (recipient.friendRequests.includes(req.params.id)) {
            _context8.next = 11;
            break;
          }

          return _context8.abrupt("return", res.status(400).json({
            success: false,
            message: "No friend request from this user"
          }));

        case 11:
          recipient.friends.push(req.params.id);
          sender.friends.push(req.user.id);
          recipient.friendRequests = recipient.friendRequests.filter(function (id) {
            return id.toString() !== req.params.id;
          });
          sender.sentFriendRequests = sender.sentFriendRequests.filter(function (id) {
            return id.toString() !== req.user.id;
          });
          _context8.next = 17;
          return regeneratorRuntime.awrap(recipient.save());

        case 17:
          _context8.next = 19;
          return regeneratorRuntime.awrap(sender.save());

        case 19:
          res.status(200).json({
            success: true,
            message: "Friend request accepted"
          });
          _context8.next = 26;
          break;

        case 22:
          _context8.prev = 22;
          _context8.t0 = _context8["catch"](0);
          console.error(_context8.t0);
          res.status(500).json({
            success: false,
            message: "Server error"
          });

        case 26:
        case "end":
          return _context8.stop();
      }
    }
  }, null, null, [[0, 22]]);
});
router.post("/friend-request/:id/reject", protect, function _callee9(req, res) {
  var sender, recipient;
  return regeneratorRuntime.async(function _callee9$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          _context9.prev = 0;
          _context9.next = 3;
          return regeneratorRuntime.awrap(User.findById(req.params.id));

        case 3:
          sender = _context9.sent;

          if (sender) {
            _context9.next = 6;
            break;
          }

          return _context9.abrupt("return", res.status(404).json({
            success: false,
            message: "User not found"
          }));

        case 6:
          _context9.next = 8;
          return regeneratorRuntime.awrap(User.findById(req.user.id));

        case 8:
          recipient = _context9.sent;
          recipient.friendRequests = recipient.friendRequests.filter(function (id) {
            return id.toString() !== req.params.id;
          });
          sender.sentFriendRequests = sender.sentFriendRequests.filter(function (id) {
            return id.toString() !== req.user.id;
          });
          _context9.next = 13;
          return regeneratorRuntime.awrap(recipient.save());

        case 13:
          _context9.next = 15;
          return regeneratorRuntime.awrap(sender.save());

        case 15:
          res.status(200).json({
            success: true,
            message: "Friend request rejected"
          });
          _context9.next = 22;
          break;

        case 18:
          _context9.prev = 18;
          _context9.t0 = _context9["catch"](0);
          console.error(_context9.t0);
          res.status(500).json({
            success: false,
            message: "Server error"
          });

        case 22:
        case "end":
          return _context9.stop();
      }
    }
  }, null, null, [[0, 18]]);
});
router["delete"]("/friends/:id", protect, function _callee10(req, res) {
  var user, friend;
  return regeneratorRuntime.async(function _callee10$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          _context10.prev = 0;
          _context10.next = 3;
          return regeneratorRuntime.awrap(User.findById(req.user.id));

        case 3:
          user = _context10.sent;
          _context10.next = 6;
          return regeneratorRuntime.awrap(User.findById(req.params.id));

        case 6:
          friend = _context10.sent;

          if (friend) {
            _context10.next = 9;
            break;
          }

          return _context10.abrupt("return", res.status(404).json({
            success: false,
            message: "User not found"
          }));

        case 9:
          if (user.friends.includes(req.params.id)) {
            _context10.next = 11;
            break;
          }

          return _context10.abrupt("return", res.status(400).json({
            success: false,
            message: "You are not friends with this user"
          }));

        case 11:
          user.friends = user.friends.filter(function (id) {
            return id.toString() !== req.params.id;
          });
          friend.friends = friend.friends.filter(function (id) {
            return id.toString() !== req.user.id;
          });
          _context10.next = 15;
          return regeneratorRuntime.awrap(user.save());

        case 15:
          _context10.next = 17;
          return regeneratorRuntime.awrap(friend.save());

        case 17:
          res.status(200).json({
            success: true,
            message: "Friend removed"
          });
          _context10.next = 24;
          break;

        case 20:
          _context10.prev = 20;
          _context10.t0 = _context10["catch"](0);
          console.error(_context10.t0);
          res.status(500).json({
            success: false,
            message: "Server error"
          });

        case 24:
        case "end":
          return _context10.stop();
      }
    }
  }, null, null, [[0, 20]]);
});
router.get("/friend-requests", protect, function _callee11(req, res) {
  var user;
  return regeneratorRuntime.async(function _callee11$(_context11) {
    while (1) {
      switch (_context11.prev = _context11.next) {
        case 0:
          _context11.prev = 0;
          _context11.next = 3;
          return regeneratorRuntime.awrap(User.findById(req.user.id).populate("friendRequests", "name username avatar"));

        case 3:
          user = _context11.sent;
          res.status(200).json({
            success: true,
            friendRequests: user.friendRequests
          });
          _context11.next = 11;
          break;

        case 7:
          _context11.prev = 7;
          _context11.t0 = _context11["catch"](0);
          console.error(_context11.t0);
          res.status(500).json({
            success: false,
            message: "Server error"
          });

        case 11:
        case "end":
          return _context11.stop();
      }
    }
  }, null, null, [[0, 7]]);
});
module.exports = router;