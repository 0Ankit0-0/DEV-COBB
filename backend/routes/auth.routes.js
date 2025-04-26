const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Project = require("../models/Project");
const { protect } = require("../middleware/auth.middleware");

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, username } = req.body;

    console.log("Registration attempt:", { name, email, username }); // Add this line

    let user = await User.findOne({ $or: [{ email }, { username }] });

    if (user) {
      return res.status(400).json({
        success: false,
        message:
          user.email === email
            ? "Email already in use"
            : "Username already taken",
      });
    }

    // Create user
    user = await User.create({
      name,
      email,
      password,
      username: username || email.split("@")[0],
    });

    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
      },
    });
  } catch (err) {
    console.error("Registration error details:", err.message); // More detailed error
    console.error(err.stack); // Add stack trace
    res.status(500).json({
      success: false,
      message: "Server error: " + err.message, // Include error message in response
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("friends", "name username avatar");

    const projectCount = await Project.countDocuments({ owner: req.user.id });

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        projectCount,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.put("/profile", protect, async (req, res) => {
  try {
    const { name, username, bio, website, location, avatar } = req.body;

    const updateFields = {};
    if (name) updateFields.name = name;
    if (username) {
      const existingUser = await User.findOne({
        username,
        _id: { $ne: req.user.id },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username already taken",
        });
      }
      updateFields.username = username;
    }
    if (bio !== undefined) updateFields.bio = bio;
    if (website !== undefined) updateFields.website = website;
    if (location !== undefined) updateFields.location = location;
    if (avatar !== undefined) updateFields.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user.id, updateFields, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.get("/users", protect, async (req, res) => {
  try {
    const { search } = req.query;

    let query = {};

    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
        ],
        _id: { $ne: req.user.id },
      };
    } else {
      query = { _id: { $ne: req.user.id } };
    }

    const users = await User.find(query)
      .select("name username avatar")
      .limit(20);

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.get("/users/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -friendRequests -sentFriendRequests")
      .populate("friends", "name username avatar");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const projectCount = await Project.countDocuments({ owner: req.params.id });

    const isFriend = user.friends.some(
      (friend) => friend._id.toString() === req.user.id
    );

    const currentUser = await User.findById(req.user.id);
    const hasSentFriendRequest = currentUser.sentFriendRequests.includes(
      req.params.id
    );

    const hasReceivedFriendRequest = currentUser.friendRequests.includes(
      req.params.id
    );

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        projectCount,
        isFriend,
        hasSentFriendRequest,
        hasReceivedFriendRequest,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.post("/friend-request/:id", protect, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a friend request to yourself",
      });
    }

    const recipient = await User.findById(req.params.id);

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const sender = await User.findById(req.user.id);

    if (sender.friends.includes(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "You are already friends with this user",
      });
    }

    if (sender.sentFriendRequests.includes(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Friend request already sent",
      });
    }

    recipient.friendRequests.push(req.user.id);
    await recipient.save();

    sender.sentFriendRequests.push(req.params.id);
    await sender.save();

    res.status(200).json({
      success: true,
      message: "Friend request sent",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.post("/friend-request/:id/accept", protect, async (req, res) => {
  try {
    const sender = await User.findById(req.params.id);

    if (!sender) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const recipient = await User.findById(req.user.id);

    if (!recipient.friendRequests.includes(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "No friend request from this user",
      });
    }

    recipient.friends.push(req.params.id);
    sender.friends.push(req.user.id);

    recipient.friendRequests = recipient.friendRequests.filter(
      (id) => id.toString() !== req.params.id
    );
    sender.sentFriendRequests = sender.sentFriendRequests.filter(
      (id) => id.toString() !== req.user.id
    );

    await recipient.save();
    await sender.save();

    res.status(200).json({
      success: true,
      message: "Friend request accepted",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.post("/friend-request/:id/reject", protect, async (req, res) => {
  try {
    const sender = await User.findById(req.params.id);

    if (!sender) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const recipient = await User.findById(req.user.id);

    recipient.friendRequests = recipient.friendRequests.filter(
      (id) => id.toString() !== req.params.id
    );
    sender.sentFriendRequests = sender.sentFriendRequests.filter(
      (id) => id.toString() !== req.user.id
    );

    await recipient.save();
    await sender.save();

    res.status(200).json({
      success: true,
      message: "Friend request rejected",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.delete("/friends/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const friend = await User.findById(req.params.id);

    if (!friend) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.friends.includes(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "You are not friends with this user",
      });
    }

    user.friends = user.friends.filter((id) => id.toString() !== req.params.id);
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

router.get("/friend-requests", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "friendRequests",
      "name username avatar"
    );

    res.status(200).json({
      success: true,
      friendRequests: user.friendRequests,
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
