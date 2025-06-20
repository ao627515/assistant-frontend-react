import React, { useState } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";

function App() {
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const startListening = () => {
    resetTranscript();
    setResponse("");
    SpeechRecognition.startListening({ continuous: false, language: "fr-FR" });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
  };

  const sendTranscript = async () => {
    if (!transcript.trim()) return;

    try {
      setLoading(true);
      console.log({ text: transcript });

      const res = await fetch("http://127.0.0.1:5000/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erreur serveur");
      console.log(data);

      setResponse(data.response);
      setError("");
    } catch (err) {
      console.log("sendTranscript", err);

      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return <p>Votre navigateur ne supporte pas la reconnaissance vocale.</p>;
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>🎤 Assistant Vocal (Reconnaissance directe)</h1>

      <button onClick={startListening} disabled={listening || loading}>
        ▶️ Démarrer
      </button>

      <button onClick={stopListening} disabled={!listening}>
        ⏹️ Arrêter
      </button>

      <button onClick={sendTranscript} disabled={!transcript || loading}>
        📤 Envoyer au serveur NLP
      </button>

      <div style={{ marginTop: "1rem" }}>
        <p><strong>🎧 État :</strong> {listening ? "Écoute en cours..." : "Inactif"}</p>
        <p><strong>💬 Vous avez dit :</strong> {transcript || "(vide)"}</p>
        {loading && <p>⏳ Traitement en cours...</p>}
        {response && <p><strong>🤖 Réponse :</strong> {response}</p>}
        {error && <p style={{ color: "red" }}>❌ {error}</p>}
      </div>
    </div>
  );
}

export default App;
