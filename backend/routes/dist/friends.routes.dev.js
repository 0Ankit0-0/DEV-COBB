"use strict";

var express = require("express");

var router = express.Router();

var _require = require("../middleware/auth.middleware"),
    protect = _require.protect;

var Friend = require("../models/Friends");

var User = require("../models/User");

router.post("/:userId", protect, function _callee(req, res) {
  var recipient, sender, existingRequest, friendRequest;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;

          if (!(req.params.userId === req.user.id)) {
            _context.next = 3;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            success: false,
            message: "You cannot send a friend request to yourself"
          }));

        case 3:
          _context.next = 5;
          return regeneratorRuntime.awrap(User.findById(req.params.userId));

        case 5:
          recipient = _context.sent;

          if (recipient) {
            _context.next = 8;
            break;
          }

          return _context.abrupt("return", res.status(404).json({
            success: false,
            message: "User not found"
          }));

        case 8:
          _context.next = 10;
          return regeneratorRuntime.awrap(User.findById(req.user.id));

        case 10:
          sender = _context.sent;

          if (!sender.friends.includes(req.params.userId)) {
            _context.next = 13;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            success: false,
            message: "You are already friends with this user"
          }));

        case 13:
          _context.next = 15;
          return regeneratorRuntime.awrap(Friend.findOne({
            $or: [{
              user: req.user.id,
              friend: req.params.userId
            }, {
              user: req.params.userId,
              friend: req.user.id
            }]
          }));

        case 15:
          existingRequest = _context.sent;

          if (!existingRequest) {
            _context.next = 18;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            success: false,
            message: "Friend request already exists"
          }));

        case 18:
          _context.next = 20;
          return regeneratorRuntime.awrap(Friend.create({
            user: req.user.id,
            friend: req.params.userId,
            status: "pending"
          }));

        case 20:
          friendRequest = _context.sent;
          recipient.friendRequests.push(req.user.id);
          _context.next = 24;
          return regeneratorRuntime.awrap(recipient.save());

        case 24:
          sender.sentFriendRequests.push(req.params.userId);
          _context.next = 27;
          return regeneratorRuntime.awrap(sender.save());

        case 27:
          res.status(201).json({
            success: true,
            message: "Friend request sent",
            friendRequest: friendRequest
          });
          _context.next = 34;
          break;

        case 30:
          _context.prev = 30;
          _context.t0 = _context["catch"](0);
          console.error(_context.t0);
          res.status(500).json({
            success: false,
            message: "Server error"
          });

        case 34:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 30]]);
});
router.put("/:requestId/accept", protect, function _callee2(req, res) {
  var friendRequest, _sender, _recipient, sender, recipient;

  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _context2.next = 3;
          return regeneratorRuntime.awrap(Friend.findById(req.params.requestId));

        case 3:
          friendRequest = _context2.sent;

          if (friendRequest) {
            _context2.next = 26;
            break;
          }

          _context2.next = 7;
          return regeneratorRuntime.awrap(User.findById(req.params.requestId));

        case 7:
          _sender = _context2.sent;

          if (_sender) {
            _context2.next = 10;
            break;
          }

          return _context2.abrupt("return", res.status(404).json({
            success: false,
            message: "User not found"
          }));

        case 10:
          _context2.next = 12;
          return regeneratorRuntime.awrap(User.findById(req.user.id));

        case 12:
          _recipient = _context2.sent;

          if (_recipient.friendRequests.includes(req.params.requestId)) {
            _context2.next = 15;
            break;
          }

          return _context2.abrupt("return", res.status(400).json({
            success: false,
            message: "No friend request from this user"
          }));

        case 15:
          _recipient.friends.push(req.params.requestId);

          _sender.friends.push(req.user.id);

          _recipient.friendRequests = _recipient.friendRequests.filter(function (id) {
            return id.toString() !== req.params.requestId;
          });
          _sender.sentFriendRequests = _sender.sentFriendRequests.filter(function (id) {
            return id.toString() !== req.user.id;
          });
          _context2.next = 21;
          return regeneratorRuntime.awrap(_recipient.save());

        case 21:
          _context2.next = 23;
          return regeneratorRuntime.awrap(_sender.save());

        case 23:
          _context2.next = 25;
          return regeneratorRuntime.awrap(Friend.create({
            user: req.user.id,
            friend: req.params.requestId,
            status: "accepted"
          }));

        case 25:
          return _context2.abrupt("return", res.status(200).json({
            success: true,
            message: "Friend request accepted"
          }));

        case 26:
          if (!(friendRequest.friend.toString() !== req.user.id)) {
            _context2.next = 28;
            break;
          }

          return _context2.abrupt("return", res.status(403).json({
            success: false,
            message: "Not authorized to update this friend request"
          }));

        case 28:
          friendRequest.status = "accepted";
          _context2.next = 31;
          return regeneratorRuntime.awrap(friendRequest.save());

        case 31:
          _context2.next = 33;
          return regeneratorRuntime.awrap(User.findById(friendRequest.user));

        case 33:
          sender = _context2.sent;
          _context2.next = 36;
          return regeneratorRuntime.awrap(User.findById(friendRequest.friend));

        case 36:
          recipient = _context2.sent;
          recipient.friends.push(friendRequest.user);
          sender.friends.push(friendRequest.friend);
          recipient.friendRequests = recipient.friendRequests.filter(function (id) {
            return id.toString() !== friendRequest.user.toString();
          });
          sender.sentFriendRequests = sender.sentFriendRequests.filter(function (id) {
            return id.toString() !== friendRequest.friend.toString();
          });
          _context2.next = 43;
          return regeneratorRuntime.awrap(recipient.save());

        case 43:
          _context2.next = 45;
          return regeneratorRuntime.awrap(sender.save());

        case 45:
          res.status(200).json({
            success: true,
            message: "Friend request accepted",
            friendRequest: friendRequest
          });
          _context2.next = 52;
          break;

        case 48:
          _context2.prev = 48;
          _context2.t0 = _context2["catch"](0);
          console.error(_context2.t0);
          res.status(500).json({
            success: false,
            message: "Server error"
          });

        case 52:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 48]]);
});
router.put("/:requestId/reject", protect, function _callee3(req, res) {
  var friendRequest, _sender2, _recipient2, sender, recipient;

  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _context3.next = 3;
          return regeneratorRuntime.awrap(Friend.findById(req.params.requestId));

        case 3:
          friendRequest = _context3.sent;

          if (friendRequest) {
            _context3.next = 20;
            break;
          }

          _context3.next = 7;
          return regeneratorRuntime.awrap(User.findById(req.params.requestId));

        case 7:
          _sender2 = _context3.sent;

          if (_sender2) {
            _context3.next = 10;
            break;
          }

          return _context3.abrupt("return", res.status(404).json({
            success: false,
            message: "User not found"
          }));

        case 10:
          _context3.next = 12;
          return regeneratorRuntime.awrap(User.findById(req.user.id));

        case 12:
          _recipient2 = _context3.sent;
          _recipient2.friendRequests = _recipient2.friendRequests.filter(function (id) {
            return id.toString() !== req.params.requestId;
          });
          _sender2.sentFriendRequests = _sender2.sentFriendRequests.filter(function (id) {
            return id.toString() !== req.user.id;
          });
          _context3.next = 17;
          return regeneratorRuntime.awrap(_recipient2.save());

        case 17:
          _context3.next = 19;
          return regeneratorRuntime.awrap(_sender2.save());

        case 19:
          return _context3.abrupt("return", res.status(200).json({
            success: true,
            message: "Friend request rejected"
          }));

        case 20:
          if (!(friendRequest.friend.toString() !== req.user.id)) {
            _context3.next = 22;
            break;
          }

          return _context3.abrupt("return", res.status(403).json({
            success: false,
            message: "Not authorized to update this friend request"
          }));

        case 22:
          friendRequest.status = "rejected";
          _context3.next = 25;
          return regeneratorRuntime.awrap(friendRequest.save());

        case 25:
          _context3.next = 27;
          return regeneratorRuntime.awrap(User.findById(friendRequest.user));

        case 27:
          sender = _context3.sent;
          _context3.next = 30;
          return regeneratorRuntime.awrap(User.findById(friendRequest.friend));

        case 30:
          recipient = _context3.sent;
          recipient.friendRequests = recipient.friendRequests.filter(function (id) {
            return id.toString() !== friendRequest.user.toString();
          });
          sender.sentFriendRequests = sender.sentFriendRequests.filter(function (id) {
            return id.toString() !== friendRequest.friend.toString();
          });
          _context3.next = 35;
          return regeneratorRuntime.awrap(recipient.save());

        case 35:
          _context3.next = 37;
          return regeneratorRuntime.awrap(sender.save());

        case 37:
          res.status(200).json({
            success: true,
            message: "Friend request rejected",
            friendRequest: friendRequest
          });
          _context3.next = 44;
          break;

        case 40:
          _context3.prev = 40;
          _context3.t0 = _context3["catch"](0);
          console.error(_context3.t0);
          res.status(500).json({
            success: false,
            message: "Server error"
          });

        case 44:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 40]]);
});
router.get("/", protect, function _callee4(req, res) {
  var user, friendRequests, friendIds, friendsFromModel, friends;
  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          _context4.next = 3;
          return regeneratorRuntime.awrap(User.findById(req.user.id).populate("friends", "name email username avatar"));

        case 3:
          user = _context4.sent;
          _context4.next = 6;
          return regeneratorRuntime.awrap(Friend.find({
            $or: [{
              user: req.user.id,
              status: "accepted"
            }, {
              friend: req.user.id,
              status: "accepted"
            }]
          }));

        case 6:
          friendRequests = _context4.sent;
          friendIds = friendRequests.map(function (request) {
            return request.user.toString() === req.user.id ? request.friend : request.user;
          });
          _context4.next = 10;
          return regeneratorRuntime.awrap(User.find({
            _id: {
              $in: friendIds
            }
          }).select("name email username avatar"));

        case 10:
          friendsFromModel = _context4.sent;
          friends = user.friends.length > 0 ? user.friends : friendsFromModel;
          res.status(200).json({
            success: true,
            count: friends.length,
            friends: friends
          });
          _context4.next = 19;
          break;

        case 15:
          _context4.prev = 15;
          _context4.t0 = _context4["catch"](0);
          console.error(_context4.t0);
          res.status(500).json({
            success: false,
            message: "Server error"
          });

        case 19:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[0, 15]]);
});
router.get("/requests", protect, function _callee5(req, res) {
  var user, friendRequests, requests;
  return regeneratorRuntime.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          _context5.next = 3;
          return regeneratorRuntime.awrap(User.findById(req.user.id).populate("friendRequests", "name username avatar"));

        case 3:
          user = _context5.sent;
          _context5.next = 6;
          return regeneratorRuntime.awrap(Friend.find({
            friend: req.user.id,
            status: "pending"
          }).populate("user", "name email username avatar"));

        case 6:
          friendRequests = _context5.sent;
          requests = user.friendRequests.length > 0 ? user.friendRequests : friendRequests.map(function (request) {
            return request.user;
          });
          res.status(200).json({
            success: true,
            count: requests.length,
            friendRequests: requests
          });
          _context5.next = 15;
          break;

        case 11:
          _context5.prev = 11;
          _context5.t0 = _context5["catch"](0);
          console.error(_context5.t0);
          res.status(500).json({
            success: false,
            message: "Server error"
          });

        case 15:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[0, 11]]);
});
router["delete"]("/:userId", protect, function _callee6(req, res) {
  var user, friend;
  return regeneratorRuntime.async(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          _context6.next = 3;
          return regeneratorRuntime.awrap(Friend.findOneAndDelete({
            $or: [{
              user: req.user.id,
              friend: req.params.userId,
              status: "accepted"
            }, {
              user: req.params.userId,
              friend: req.user.id,
              status: "accepted"
            }]
          }));

        case 3:
          _context6.next = 5;
          return regeneratorRuntime.awrap(User.findById(req.user.id));

        case 5:
          user = _context6.sent;
          _context6.next = 8;
          return regeneratorRuntime.awrap(User.findById(req.params.userId));

        case 8:
          friend = _context6.sent;

          if (friend) {
            _context6.next = 11;
            break;
          }

          return _context6.abrupt("return", res.status(404).json({
            success: false,
            message: "User not found"
          }));

        case 11:
          user.friends = user.friends.filter(function (id) {
            return id.toString() !== req.params.userId;
          });
          friend.friends = friend.friends.filter(function (id) {
            return id.toString() !== req.user.id;
          });
          _context6.next = 15;
          return regeneratorRuntime.awrap(user.save());

        case 15:
          _context6.next = 17;
          return regeneratorRuntime.awrap(friend.save());

        case 17:
          res.status(200).json({
            success: true,
            message: "Friend removed"
          });
          _context6.next = 24;
          break;

        case 20:
          _context6.prev = 20;
          _context6.t0 = _context6["catch"](0);
          console.error(_context6.t0);
          res.status(500).json({
            success: false,
            message: "Server error"
          });

        case 24:
        case "end":
          return _context6.stop();
      }
    }
  }, null, null, [[0, 20]]);
});
module.exports = router;