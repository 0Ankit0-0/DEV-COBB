import React from "react";
import { createProject } from "../../../contexts/projectContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
const projectf = () => {
  const [projectData, setProjectData] = {
    name: " ",
    description: "",
    isPublic: "",
    tags: "",
    template: "",
    thumbnail: "",
    languageUsed: "",
  };

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setProjectData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleOnCreate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
  };

  if (
    !projectData.name ||
    !projectData.description ||
    !projectData.tags ||
    !projectData.thumbnail ||
    !projectData.languageUsed
  ) {
    toast.error("Please fill in all fields");
    setIsLoading(false);
    return;
  }

  const { createProjects } = createProject()

  try {
    await createProjects({
        name: projectData.name,
        description: projectData.description,
        tags: projectData.tags,
        languageUsed: projectData.languageUsed,
        thumbnail: projectData.thumbnail,
        template: projectData.template,
        isPublic: projectData.isPublic
    })
    toast.success("Project created successfully! Happy Coding :) ");
      navigate("/");
  }catch (err) {
      toast.error(
        err?.response?.data?.message ||
          error ||
          "Project Creation failed. Please try again."
      );
    }finally {
      setIsLoading(false);}

  return (
    <>
      <div></div>
    </>
  );
};
export default projectf;