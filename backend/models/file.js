const mongoose = require('mongoose');

const fileSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    type: {
      type: String,
      enum: ['file', 'folder'],
      required: [true, 'Please specify the type'],
    },
    content: {
      type: String,
      default: '',
    },
    path: {
      type: String,
      required: [true, 'Please add a path'],
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      default: null,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    language: {
      type: String,
      default: 'plaintext',
    },
    isOpen: {
      type: Boolean,
      default: false,
    },
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        text: String,
        line: Number,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const File = mongoose.model('File', fileSchema);

module.exports = File;