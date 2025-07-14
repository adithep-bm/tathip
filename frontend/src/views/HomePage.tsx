import { Link } from "react-router-dom";

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  background: "linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)",
};

const buttonStyle: React.CSSProperties = {
  padding: "0.75rem 2rem",
  fontSize: "1.1rem",
  background: "#4f8cff",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(79,140,255,0.15)",
  cursor: "pointer",
  transition: "background 0.2s",
};

function Home() {
  return (
    <div style={containerStyle}>
      <h1 style={{ color: "#2d3a4b", marginBottom: "2rem" }}>Welcome to Tathip</h1>
      <Link to="/login">
        <button
          style={buttonStyle}
          onMouseOver={e => (e.currentTarget.style.background = "#357ae8")}
          onMouseOut={e => (e.currentTarget.style.background = "#4f8cff")}
        >
          ไปหน้า Login
        </button>
      </Link>
    </div>
  );
}

export default Home;