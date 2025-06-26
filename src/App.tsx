import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import React, { useContext } from "react";
import { AuthProvider, AuthContext } from "./contexts/AuthProvider";

import LoginPage from "./pages/LoginPage";
import SelectionPage from "./pages/SelectionPage";
import VideoListPage from "./pages/VideoListPage";
import UploadVideoPage from "./pages/UploadVideoPage";
import ManualListPage from "./pages/ManualListPage";
import UploadManualPage from "./pages/UploadManualPage";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/" />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route
            path="/select"
            element={
              <ProtectedRoute>
                <SelectionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/videos"
            element={
              <ProtectedRoute>
                <VideoListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload-video"
            element={
              <ProtectedRoute>
                <UploadVideoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manuals"
            element={
              <ProtectedRoute>
                <ManualListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload-manual"
            element={
              <ProtectedRoute>
                <UploadManualPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;