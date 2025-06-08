import React, { useState } from "react";
import { createProject } from "../../../contexts/projectContext";
import toast from "react-hot-toast";
import api from "../../../services/api";
import "../Projectf/projectf.css"
const Projectf = ({ isOpen, onClose, onCreated }) => {
  const [projectData, setProjectData] = useState({
    name: "",
    description: "",
    isPublic: false,
    tags: "",
    template: "",
    thumbnail: "",
    languageUsed: "",
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle image upload and get a fake URL (replace with your actual upload logic)
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
      // Preview the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setProjectData((prev) => ({
          ...prev,
          thumbnail: reader.result, // For preview; for real upload, replace with URL after upload
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProjectData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Should upload image to a server, get URL, and set projectData.thumbnail to that URL
  // Here we just use base64 for demo; you should replace this with your upload logic!
  const handleOnCreate = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (
      !projectData.name ||
      !projectData.description ||
      !projectData.tags ||
      !projectData.languageUsed
    ) {
      toast.error("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    try {
      let thumbnailUrl = projectData.thumbnail;
      // Optionally: Upload image to server/cloud and get a URL, then set thumbnailUrl
      // Example: If you have an /upload endpoint
      if (thumbnailFile) {
        const formData = new FormData();
        formData.append("file", thumbnailFile);
        const uploadRes = await api.post("/upload", formData);
        thumbnailUrl = uploadRes.data.url;
      }
      await createProject({
        ...projectData,
        tags: projectData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        thumbnail: thumbnailUrl,
      });
      toast.success("Project created successfully!");
      onCreated && onCreated();
      onClose && onClose();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
        err?.message ||
        "Project Creation failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-form">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <h2>Create New Project</h2>
        <form onSubmit={handleOnCreate}>
          <input
            name="name"
            value={projectData.name}
            onChange={handleChange}
            placeholder="Project Name"
            required
          />
          <textarea
            name="description"
            value={projectData.description}
            onChange={handleChange}
            placeholder="Description"
            required
          />
          <input
            name="tags"
            value={projectData.tags}
            onChange={handleChange}
            placeholder="Tags (comma separated)"
            required
          />
          <input
            name="languageUsed"
            value={projectData.languageUsed}
            onChange={handleChange}
            placeholder="Language"
            required
          />
          <input
            name="template"
            value={projectData.template}
            onChange={handleChange}
            placeholder="Template (optional)"
          />
          <label>
            Public:
            <input
              type="checkbox"
              name="isPublic"
              checked={projectData.isPublic}
              onChange={handleChange}
            />
          </label>
          <div>
            <label>Thumbnail Image:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
            />
            {projectData.thumbnail && (
              <img
                src={projectData.thumbnail}
                alt="Thumbnail preview"
                style={{ width: 80, marginTop: 8 }}
              />
            )}
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Project"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Projectf;
