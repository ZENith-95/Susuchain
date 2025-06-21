import { Routes, Route, Navigate } from "react-router-dom";
import { useApp } from "./context/AppContext";
import Layout from "./components/Layout";

import LandingPage from "./pages/LandingPage";

import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import CreateGroup from "./pages/CreateGroup";
import JoinGroup from "./pages/JoinGroup";
import GroupDetail from "./pages/GroupDetail";
import PersonalSavings from "./pages/PersonalSavings";
import Settings from "./pages/Settings";

function App() {
  const { user } = useApp();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          user ? (
            <Layout>
              <Dashboard />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/create-group"
        element={
          user ? (
            <Layout>
              <CreateGroup />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/join-group"
        element={
          user ? (
            <Layout>
              <JoinGroup />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/group/:id"
        element={
          user ? (
            <Layout>
              <GroupDetail />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/savings"
        element={
          user ? (
            <Layout>
              <PersonalSavings />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/settings"
        element={
          user ? (
            <Layout>
              <Settings />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
}

export default App;
