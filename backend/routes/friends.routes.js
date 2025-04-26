const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const Friend = require("../models/Friends");
const User = require("../models/User");

router.post("/:userId", protect, async (req, res) => {
  try {
    if (req.params.userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a friend request to yourself",
      });
    }

    const recipient = await User.findById(req.params.userId);

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const sender = await User.findById(req.user.id);

    if (sender.friends.includes(req.params.userId)) {
      return res.status(400).json({
        success: false,
        message: "You are already friends with this user",
      });
    }

    const existingRequest = await Friend.findOne({
      $or: [
        { user: req.user.id, friend: req.params.userId },
        { user: req.params.userId, friend: req.user.id },
      ],
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "Friend request already exists",
      });
    }

    const friendRequest = await Friend.create({
      user: req.user.id,
      friend: req.params.userId,
      status: "pending",
    });

    recipient.friendRequests.push(req.user.id);
    await recipient.save();

    sender.sentFriendRequests.push(req.params.userId);
    await sender.save();

    res.status(201).json({
      success: true,
      message: "Friend request sent",
      friendRequest,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.put("/:requestId/accept", protect, async (req, res) => {
  try {
    const friendRequest = await Friend.findById(req.params.requestId);

    if (!friendRequest) {
      const sender = await User.findById(req.params.requestId);

      if (!sender) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const recipient = await User.findById(req.user.id);

      if (!recipient.friendRequests.includes(req.params.requestId)) {
        return res.status(400).json({
          success: false,
          message: "No friend request from this user",
        });
      }

      recipient.friends.push(req.params.requestId);
      sender.friends.push(req.user.id);

      recipient.friendRequests = recipient.friendRequests.filter(
        (id) => id.toString() !== req.params.requestId
      );
      sender.sentFriendRequests = sender.sentFriendRequests.filter(
        (id) => id.toString() !== req.user.id
      );

      await recipient.save();
      await sender.save();

      await Friend.create({
        user: req.user.id,
        friend: req.params.requestId,
        status: "accepted",
      });

      return res.status(200).json({
        success: true,
        message: "Friend request accepted",
      });
    }

    if (friendRequest.friend.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this friend request",
      });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    const sender = await User.findById(friendRequest.user);
    const recipient = await User.findById(friendRequest.friend);

    recipient.friends.push(friendRequest.user);
    sender.friends.push(friendRequest.friend);

    recipient.friendRequests = recipient.friendRequests.filter(
      (id) => id.toString() !== friendRequest.user.toString()
    );
    sender.sentFriendRequests = sender.sentFriendRequests.filter(
      (id) => id.toString() !== friendRequest.friend.toString()
    );

    await recipient.save();
    await sender.save();

    res.status(200).json({
      success: true,
      message: "Friend request accepted",
      friendRequest,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.put("/:requestId/reject", protect, async (req, res) => {
  try {
    const friendRequest = await Friend.findById(req.params.requestId);

    if (!friendRequest) {
      const sender = await User.findById(req.params.requestId);

      if (!sender) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const recipient = await User.findById(req.user.id);

      recipient.friendRequests = recipient.friendRequests.filter(
        (id) => id.toString() !== req.params.requestId
      );
      sender.sentFriendRequests = sender.sentFriendRequests.filter(
        (id) => id.toString() !== req.user.id
      );

      await recipient.save();
      await sender.save();

      return res.status(200).json({
        success: true,
        message: "Friend request rejected",
      });
    }

    if (friendRequest.friend.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this friend request",
      });
    }

    friendRequest.status = "rejected";
    await friendRequest.save();

    const sender = await User.findById(friendRequest.user);
    const recipient = await User.findById(friendRequest.friend);

    recipient.friendRequests = recipient.friendRequests.filter(
      (id) => id.toString() !== friendRequest.user.toString()
    );
    sender.sentFriendRequests = sender.sentFriendRequests.filter(
      (id) => id.toString() !== friendRequest.friend.toString()
    );

    await recipient.save();
    await sender.save();

    res.status(200).json({
      success: true,
      message: "Friend request rejected",
      friendRequest,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "friends",
      "name email username avatar"
    );

    const friendRequests = await Friend.find({
      $or: [
        { user: req.user.id, status: "accepted" },
        { friend: req.user.id, status: "accepted" },
      ],
    });

    const friendIds = friendRequests.map((request) => {
      return request.user.toString() === req.user.id
        ? request.friend
        : request.user;
    });

    const friendsFromModel = await User.find({
      _id: { $in: friendIds },
    }).select("name email username avatar");

    const friends = user.friends.length > 0 ? user.friends : friendsFromModel;

    res.status(200).json({
      success: true,
      count: friends.length,
      friends,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.get("/requests", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "friendRequests",
      "name username avatar"
    );

    const friendRequests = await Friend.find({
      friend: req.user.id,
      status: "pending",
    }).populate("user", "name email username avatar");

    const requests =
      user.friendRequests.length > 0
        ? user.friendRequests
        : friendRequests.map((request) => request.user);

    res.status(200).json({
      success: true,
      count: requests.length,
      friendRequests: requests,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.delete("/:userId", protect, async (req, res) => {
  try {
    await Friend.findOneAndDelete({
      $or: [
        { user: req.user.id, friend: req.params.userId, status: "accepted" },
        { user: req.params.userId, friend: req.user.id, status: "accepted" },
      ],
    });

    const user = await User.findById(req.user.id);
    const friend = await User.findById(req.params.userId);

    if (!friend) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.friends = user.friends.filter(
      (id) => id.toString() !== req.params.userId
    );
    friend.friends = friend.friends.filter(
      (id) => id.toString() !== req.user.id
    );

    await user.save();
    await friend.save();

    res.status(200).json({
      success: true,
      message: "Friend removed",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
