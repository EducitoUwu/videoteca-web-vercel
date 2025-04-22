import { useEffect, useState } from "react";
import VideoListing from "./components/VideoListing";
import VideoUpload from "./components/VideoUpload";
import useVideoSelection from "./hooks/useVideoSelection";
import loginService from "./services/login";
import { LoginCredentials, LoginResponse } from "./types/login";
import ManualBuilder from "./components/manualBuilder/ManualBuilder";
import "./App.css";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);

  const { selectedVideoId } = useVideoSelection();

  useEffect(() => {
    // Solo para pruebas sin login
    setUser({ email: "test@dev.com" });
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const loginResponse: LoginResponse = await loginService.login({
        email,
        password,
      } as LoginCredentials);
      const { user, accesToken, refreshToken } = loginResponse.data;
      localStorage.setItem("accessToken", accesToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);
      setErrorMessage(null);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage("Credenciales incorrectas: " + error.message);
      } else {
        setErrorMessage("Credenciales incorrectas: An unknown error occurred.");
      }
      setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
    }
  };

  useEffect(() => {
    console.log("Selected video ID app:", selectedVideoId);
  }, [selectedVideoId]);

  // 🔒 Esto solo se ejecuta si user está vacío (antes de setUser)
  if (!user) {
    return (
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
    );
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "1rem" }}>
        <div>Bienvenido, {user.email}</div>
        <button onClick={() => setManualMode(!manualMode)}>
          {manualMode ? "Volver a Videoteca" : "Ir al Manual Builder"}
        </button>
      </div>

      {manualMode ? (
        <ManualBuilder />
      ) : (
        <>
          <VideoUpload />
          <VideoListing />
        </>
      )}

      {errorMessage && <div style={{ color: "red" }}>{errorMessage}</div>}
    </>
  );
}

export default App;
