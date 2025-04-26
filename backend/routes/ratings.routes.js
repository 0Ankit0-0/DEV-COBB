const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const Rating = require("../models/Rating");
const Project = require("../models/Project");

router.post("/:projectId/ratings", protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const existingRating = await Rating.findOne({
      project: req.params.projectId,
      user: req.user.id,
    });

    if (existingRating) {
      existingRating.rating = rating;
      existingRating.comment = comment;
      await existingRating.save();

      return res.status(200).json({
        success: true,
        rating: existingRating,
      });
    }

    const newRating = await Rating.create({
      project: req.params.projectId,
      user: req.user.id,
      rating,
      comment,
    });

    res.status(201).json({
      success: true,
      rating: newRating,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.get("/:projectId/ratings", protect, async (req, res) => {
  try {
    const ratings = await Rating.find({ project: req.params.projectId })
      .populate("user", "name username avatar")
      .sort({ createdAt: -1 });

    const totalRatings = ratings.length;
    const averageRating =
      totalRatings > 0
        ? ratings.reduce((sum, item) => sum + item.rating, 0) / totalRatings
        : 0;

    res.status(200).json({
      success: true,
      count: ratings.length,
      averageRating,
      ratings,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.delete("/:projectId/ratings", protect, async (req, res) => {
  try {
    const rating = await Rating.findOneAndDelete({
      project: req.params.projectId,
      user: req.user.id,
    });

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: "Rating not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Rating deleted",
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
