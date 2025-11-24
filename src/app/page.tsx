import Chatbot from "../components/Chatbot";

export default function Home() {
  return (
    <main style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Optional */}
      <div style={{ textAlign: "center", padding: "1rem 0" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", margin: 0 }}>Meo</h1>
        <p style={{ fontSize: "1rem", color: "#ccc", margin: 0 }}>
          Your Metabolic Health AI Assistant
        </p>
      </div>

      {/* Chatbot fills the screen */}
      <div style={{ flexGrow: 1 }}>
        <Chatbot />
      </div>
    </main>
  );
}
