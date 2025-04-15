import axios from "axios";

const baseUrl = "http://localhost:3000/api/v1/auth/login";

const login = async (credentials: { email: string; password: string }) => {
  const { data } = await axios.post(baseUrl, credentials);
  return data;
};

export default { login };
