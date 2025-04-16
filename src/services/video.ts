import axios from "axios";

const fetchAllVideos = async () => {
  const response = await axios.get(`http://localhost:9999/api/v1/videos`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return response.data.data;
};

export default { fetchAllVideos };
