import { useState } from "react";
import loginService from "./services/login";
import "./App.css";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      console.log("Logging in with", { email, password });
      const user = await loginService.login({ email, password });
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

export default App;
