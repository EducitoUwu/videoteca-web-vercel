import { useState } from "react";
import loginService from "./services/login";
import "./App.css";
import VideoUpload from "./components/VideoUpload";
import VideoPlayer from "./components/VideoPlayer";
import VideoListing from "./components/VideoListing";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const loginResponse = await loginService.login({ email, password });
      const { user, accesToken, refreshToken } = loginResponse.data;
      localStorage.setItem("accessToken", accesToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage("Credenciales incorrectas" + error.message);
      setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          width: "300px",
          margin: "0 auto",
          gap: "10px",
        }}
      >
        <input
          type="email"
          value={email}
          name="email"
          placeholder="example@mail.com"
          onChange={({ target }) => setEmail(target.value)}
        />
        <input
          type="password"
          value={password}
          name="password"
          placeholder="********"
          onChange={({ target }) => setPassword(target.value)}
        />
        <button type="submit">Login</button>
      </form>
      {user && (
        <>
          <div>Bienvenido, {user.email}</div>
          <VideoUpload />
          <VideoPlayer videoId="12345" />
          <VideoListing />
          {errorMessage && <div style={{ color: "red" }}>{errorMessage}</div>}
        </>
      )}
    </>
  );
}

export default App;
