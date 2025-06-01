const mongoose = require('mongoose');

const projectSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a project name'],
    },
    description: {
      type: String,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    collaborators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['viewer', 'editor', 'admin'],
          default: 'viewer',
        },
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
    thumbnail: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'javascript',
    },
    tags: [String],
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    rootFolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
    },
    template: {
      type: String,
      default: '',
    },
    analytics: {
      views: {
        type: Number,
        default: 0,
      },
      commits: {
        type: Number,
        default: 0,
      },
      lastOpened: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;