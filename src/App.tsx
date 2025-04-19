import { useEffect, useState } from "react";
import VideoListing from "./components/VideoListing";
import VideoUpload from "./components/VideoUpload";
import useVideoSelection from "./hooks/useVideoSelection";
import loginService from "./services/login";
import { LoginCredentials, LoginResponse } from "./types/login";
import { Button } from "./components/ui/button";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { selectedVideoId } = useVideoSelection();

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

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className={"flex flex-col w-72 mx-auto gap-2.5"}
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
        <Button type="submit">Login</Button>
      </form>
      {user && (
        <>
          <div>Bienvenido, {user.email}</div>
          <VideoUpload />
          {errorMessage && <div style={{ color: "red" }}>{errorMessage}</div>}

          {/* Pass the selectVideo function to VideoListing */}
          <VideoListing />

          {errorMessage && <div style={{ color: "red" }}>{errorMessage}</div>}
        </>
      )}
    </>
  );
}

export default App;
