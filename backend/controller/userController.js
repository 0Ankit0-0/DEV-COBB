const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;

  if (!name || !username || !email || !password) {
    res.status(400);
    throw new Error("Please add all required fields");
  }

  // Check if user exists
  const userExists = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists with this email or username");
  }

  // Create user
  const user = await User.create({
    name,
    username,
    email,
    password,
  });

  if (user) {
    res.status(201).json({
      _id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { login, password } = req.body;

  // Check for user by email or username
  const user = await User.findOne({
    $or: [{ email: login }, { username: login }],
  });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      settings: user.settings,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid credentials");
  }
});

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate("friends", "name username avatar")
    .select("-password");

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.avatar = req.body.avatar || user.avatar;
    user.bio = req.body.bio || user.bio;
    user.skills = req.body.skills || user.skills;
    user.github = req.body.github || user.github;
    user.website = req.body.website || user.website;

    // Check if username or email is already taken by another user
    if (req.body.username && req.body.username !== user.username) {
      const usernameExists = await User.findOne({ username: req.body.username });
      if (usernameExists) {
        res.status(400);
        throw new Error("Username already taken");
      }
    }

    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        res.status(400);
        throw new Error("Email already taken");
      }
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      username: updatedUser.username,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      skills: updatedUser.skills,
      github: updatedUser.github,
      website: updatedUser.website,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const updateUserSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (user) {
    user.settings = { ...user.settings, ...req.body };
    const updatedUser = await user.save();

    res.json({
      settings: updatedUser.settings,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id);

  if (user && (await user.matchPassword(currentPassword))) {
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } else {
    res.status(400);
    throw new Error("Current password is incorrect");
  }
});

const getUserByUsername = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username })
    .populate("friends", "name username avatar")
    .select("-password -email");

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const searchUsers = asyncHandler(async (req, res) => {
  const query = req.params.query;

  const users = await User.find({
    $or: [
      { name: { $regex: query, $options: "i" } },
      { username: { $regex: query, $options: "i" } },
      { bio: { $regex: query, $options: "i" } },
    ],
  })
    .select("-password -email")
    .limit(20);

  res.json(users);
});

const addFriend = asyncHandler(async (req, res) => {
  const { userId } = req.params.userId;
  const currentUserId = req.user.id;

  if (userId === currentUserId) {
    res.status(400);
    throw new Error("Cannot add yourself as friend");
  }

  const user = await User.findById(currentUserId);
  const friendUser = await User.findById(userId);

  if (!friendUser) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.friends.includes(userId)) {
    res.status(400);
    throw new Error("User is already your friend");
  }

  user.friends.push(userId);
  friendUser.friends.push(currentUserId);

  await user.save();
  await friendUser.save();

  res.json({ message: "Friend added successfully" });
});

const removeFriend = asyncHandler(async (req, res) => {
  const { userId } = req.params.userId;
  const currentUserId = req.user.id;

  const user = await User.findById(currentUserId);
  const friendUser = await User.findById(userId);

  if (!friendUser) {
    res.status(404);
    throw new Error("User not found");
  }

  user.friends = user.friends.filter(
    (friendId) => friendId.toString() !== userId
  );
  friendUser.friends = friendUser.friends.filter(
    (friendId) => friendId.toString() !== currentUserId
  );

  await user.save();
  await friendUser.save();

  res.json({ message: "Friend removed successfully" });
});

const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const users = await User.find({})
    .select("-password")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments();

  res.json({
    users,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalUsers: total,
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id); // Use authenticated user's id

  if (user) {
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: "User removed" });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  updateUserSettings,
  changePassword,
  getUserByUsername,
  searchUsers,
  addFriend,
  removeFriend,
  getAllUsers,
  deleteUser,
};