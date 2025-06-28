import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Cookies from "js-cookie";

import Login from "./components/Login";
import Register from "./components/Register";
import Home from "./components/Home";
import Projects from "./components/Projects";
import FailureView from "./components/FailureView";
import NotFound from "./components/NotFound";

import UserContext from "./context/UserContext";

// Constants
const apiStatusConstants = {
  initial: "INITIAL",
  inProgress: "IN_PROGRESS",
  success: "SUCCESS",
  failure: "FAILURE",
};

const API_BASE_URL = "http://localhost:8000";

function App() {
  // === State variables ===
  const [apiStatus, setApiStatus] = useState(apiStatusConstants.initial);
  const [user, setUser] = useState(null);

  const verifyUser = async () => {
    // Get jwtToken from cookies
    const jwtToken = Cookies.get("jwtToken");

    // Set to loading view
    setApiStatus(apiStatusConstants.inProgress);
    try {
      // "Decode token and get payload" from API
      const response = await fetch(`${API_BASE_URL}/api/protected`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      if (response.ok) {
        // On decode success
        const { user } = await response.json();
        setUser(user);
      } else {
        // On decode failure, User authentication fails
        setUser(null);
      }

      // Update user state
      setUser(user);
      // Set to success view
      setApiStatus(apiStatusConstants.success);
    } catch (e) {
      console.log(e);
      // Update user state
      setUser(null);
      // Set to failure view
      setApiStatus(apiStatusConstants.failure);
    }
  };

  useEffect(() => {
    verifyUser();
  }, []);

  // === Render loading view ===
  const renderLoadingView = () => {
    return <div>Loading</div>;
  };

  // === Render failure view ===
  const renderFailureView = () => {
    return <FailureView />;
  };

  // === Render success view ===
  const renderSuccessView = () => {
    return (
      <>
        <UserContext.Provider value={{ user, setUser }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/not-found" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/not-found" replace />} />
          </Routes>
        </UserContext.Provider>
      </>
    );
  };

  const renderView = () => {
    switch (apiStatus) {
      case apiStatusConstants.success:
        return renderSuccessView();
      case apiStatusConstants.failure:
        return renderFailureView();
      case apiStatusConstants.inProgress:
        return renderLoadingView();
      default:
        return null;
    }
  };

  return <div>{renderView()}</div>;
}

export default App;
