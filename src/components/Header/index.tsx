import React from "react";
import { useNavigate } from "react-router-dom";

const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header style={headerStyle}>
      <h1 style={titleStyle}>Photography</h1>
      <div style={buttonContainerStyle}>
        <button style={buttonStyle} onClick={() => navigate("/login")}>
          Login
        </button>
        <button style={buttonStyle} onClick={() => navigate("/register")}>
          Signup
        </button>
      </div>
    </header>
  );
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 20px",
  backgroundColor: "#282c34",
  color: "white",
  position: "relative",
  top: 0,
  width: "100%",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
};

const buttonContainerStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  marginRight: "30px",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 20px",
  backgroundColor: "#61dafb",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

export default Header;
