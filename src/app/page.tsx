import Chatbot from '../components/Chatbot';

export default function Home() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Meo</h1>
        <p style={{ fontSize: '1.2rem', color: '#555' }}>Your Metabolic Health AI Assistant</p>
      </div>
      <Chatbot />
    </main>
  );
}