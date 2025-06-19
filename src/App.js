import React, { useState, useRef, useEffect } from "react";

function App() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  // Nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecordingTime(0);
  };

  const startRecording = async () => {
    try {
      setError("");
      setMessage("");
      setResponse("");

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Votre navigateur ne supporte pas l'enregistrement audio"
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          volume: 1.0,
        },
      });

      streamRef.current = stream;

      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg",
      ];

      let mimeType = "audio/webm";
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType,
      });

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stopTimer();
        setLoading(true);

        try {
          const blob = new Blob(chunksRef.current, { type: mimeType });

          if (blob.size === 0) {
            throw new Error("Aucun audio enregistré");
          }

          const formData = new FormData();
          formData.append("audio", blob, "voice.webm");

          const res = await fetch("http://localhost:5000/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || `Erreur HTTP: ${res.status}`);
          }

          const data = await res.json();

          setMessage(`Vous avez dit : "${data.text}"`);
          setResponse(data.response);

          if (data.audio_id) {
            try {
              const audio = new Audio(
                `http://localhost:5000/response-audio/${data.audio_id}`
              );

              audio.onloadeddata = () => {
                audio.play().catch((e) => {
                  console.warn("Lecture audio échouée:", e);
                  setError("Impossible de lire la réponse audio");
                });
              };

              audio.onerror = () => {
                console.warn("Erreur de chargement audio");
                setError("Erreur de chargement de la réponse audio");
              };
            } catch (audioError) {
              console.warn("Erreur audio:", audioError);
            }
          }
        } catch (fetchError) {
          console.error("Erreur de transcription:", fetchError);
          setError(`Erreur: ${fetchError.message}`);
        } finally {
          setLoading(false);
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }
        }
      };

      recorder.onerror = (e) => {
        console.error("Erreur MediaRecorder:", e);
        setError("Erreur d'enregistrement");
        setRecording(false);
        stopTimer();
      };

      recorder.start(250);
      setRecording(true);
      startTimer();

      setTimeout(() => {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === "recording"
        ) {
          mediaRecorderRef.current.stop();
          setRecording(false);
        }
      }, 6000);
    } catch (err) {
      console.error("Erreur de démarrage:", err);
      setError(`Erreur: ${err.message}`);
      setRecording(false);
      stopTimer();

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const testModel = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/test-model");
      const data = await response.json();
      if (response.ok) {
        setError("");
        alert(
          `Modèle Vosk OK ✅\nChemin: ${data.model_info.model_path}\nExiste: ${data.model_info.model_exists}`
        );
      } else {
        throw new Error(data.error || "Erreur de test du modèle");
      }
    } catch (err) {
      setError(`Erreur du modèle Vosk: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/health");
      if (response.ok) {
        setError("");
        alert("Connexion au serveur OK ✅");
      } else {
        throw new Error("Serveur non accessible");
      }
    } catch (err) {
      setError(
        "Impossible de se connecter au serveur. Vérifiez qu'il est démarré."
      );
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: "100vh",
      background:
        "linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff6b35 100%)",
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      padding: "1rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    card: {
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(10px)",
      borderRadius: "24px",
      padding: "2rem",
      maxWidth: "900px",
      width: "100%",
      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
    },
    header: {
      textAlign: "center",
      marginBottom: "2rem",
    },
    title: {
      fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
      fontWeight: "700",
      background: "linear-gradient(45deg, #ff6b35, #f7931e)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      marginBottom: "0.5rem",
    },
    subtitle: {
      color: "#666",
      fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
      fontWeight: "400",
    },
    controlsSection: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "1.5rem",
      marginBottom: "2rem",
    },
    mainButton: {
      fontSize: "clamp(1rem, 2.5vw, 1.3rem)",
      padding: "1rem 2rem",
      borderRadius: "50px",
      border: "none",
      cursor: "pointer",
      fontWeight: "600",
      transition: "all 0.3s ease",
      minWidth: "280px",
      position: "relative",
      overflow: "hidden",
    },
    recordingButton: {
      background: "linear-gradient(45deg, #e74c3c, #c0392b)",
      color: "white",
      boxShadow: "0 8px 25px rgba(231, 76, 60, 0.3)",
      animation: "pulse 2s infinite",
    },
    startButton: {
      background: "linear-gradient(45deg, #ff6b35, #f7931e)",
      color: "white",
      boxShadow: "0 8px 25px rgba(255, 107, 53, 0.3)",
    },
    loadingButton: {
      background: "linear-gradient(45deg, #95a5a6, #7f8c8d)",
      color: "white",
      cursor: "not-allowed",
    },
    stopButton: {
      background: "linear-gradient(45deg, #e67e22, #d35400)",
      color: "white",
      padding: "0.8rem 1.5rem",
      fontSize: "clamp(0.9rem, 2vw, 1.1rem)",
      borderRadius: "50px",
      border: "none",
      cursor: "pointer",
      fontWeight: "600",
      boxShadow: "0 6px 20px rgba(230, 126, 34, 0.3)",
      transition: "all 0.3s ease",
    },
    testButtons: {
      display: "flex",
      flexWrap: "wrap",
      gap: "1rem",
      justifyContent: "center",
    },
    testButton: {
      fontSize: "clamp(0.8rem, 2vw, 0.9rem)",
      padding: "0.6rem 1.2rem",
      borderRadius: "25px",
      border: "none",
      cursor: "pointer",
      fontWeight: "500",
      transition: "all 0.3s ease",
      minWidth: "120px",
    },
    serverTestButton: {
      background: "linear-gradient(45deg, #27ae60, #2ecc71)",
      color: "white",
      boxShadow: "0 4px 15px rgba(39, 174, 96, 0.3)",
    },
    modelTestButton: {
      background: "linear-gradient(45deg, #8e44ad, #9b59b6)",
      color: "white",
      boxShadow: "0 4px 15px rgba(142, 68, 173, 0.3)",
    },
    messagesSection: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      marginBottom: "2rem",
    },
    messageCard: {
      padding: "1rem 1.5rem",
      borderRadius: "16px",
      fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
      lineHeight: "1.5",
      position: "relative",
      overflow: "hidden",
    },
    errorCard: {
      background: "linear-gradient(45deg, #ffebee, #ffcdd2)",
      color: "#c62828",
      border: "2px solid #ef5350",
    },
    transcriptCard: {
      background: "linear-gradient(45deg, #e3f2fd, #bbdefb)",
      color: "#1565c0",
      border: "2px solid #42a5f5",
    },
    responseCard: {
      background: "linear-gradient(45deg, #fff3e0, #ffe0b2)",
      color: "#e65100",
      border: "2px solid #ff9800",
      fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
      fontWeight: "600",
    },
    instructionsSection: {
      background: "rgba(255, 107, 53, 0.1)",
      padding: "1.5rem",
      borderRadius: "16px",
      border: "1px solid rgba(255, 107, 53, 0.2)",
    },
    instructionsTitle: {
      color: "#d35400",
      fontSize: "clamp(1.1rem, 2.5vw, 1.3rem)",
      fontWeight: "600",
      marginBottom: "1rem",
      textAlign: "center",
    },
    instructionsList: {
      color: "#7f8c8d",
      fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
      lineHeight: "1.6",
      listStyle: "none",
      padding: "0",
    },
    instructionItem: {
      padding: "0.5rem 0",
      position: "relative",
      paddingLeft: "1.5rem",
    },
    recordingIndicator: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem",
      marginTop: "0.5rem",
    },
    pulsingDot: {
      width: "12px",
      height: "12px",
      borderRadius: "50%",
      background: "#e74c3c",
      animation: "pulse 1s infinite",
    },
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @media (max-width: 768px) {
          .main-button {
            min-width: 250px !important;
            padding: 0.8rem 1.5rem !important;
          }
          
          .test-buttons {
            flex-direction: column;
            align-items: center;
          }
          
          .test-button {
            width: 200px;
          }
        }
        
        @media (max-width: 480px) {
          .card {
            padding: 1.5rem !important;
            margin: 0.5rem !important;
          }
          
          .main-button {
            min-width: 200px !important;
          }
        }
        
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2) !important;
        }
        
        button:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>

      <div style={styles.card} className="card">
        {/* En-tête */}
        <div style={styles.header}>
          <h1 style={styles.title}>🎤 Assistant Vocal Orange</h1>
          <p style={styles.subtitle}>Intelligence artificielle en français</p>
        </div>

        {/* Zone de contrôles */}
        <div style={styles.controlsSection}>
          <button
            onClick={startRecording}
            disabled={recording || loading}
            style={{
              ...styles.mainButton,
              ...(recording
                ? styles.recordingButton
                : loading
                ? styles.loadingButton
                : styles.startButton),
            }}
            className="main-button"
          >
            {recording
              ? `🔴 Enregistrement en cours...`
              : loading
              ? "⏳ Traitement de votre demande..."
              : "🎙️ Commencer l'enregistrement"}
          </button>

          {recording && (
            <div>
              <button onClick={stopRecording} style={styles.stopButton}>
                ⏹️ Arrêter l'enregistrement
              </button>
              <div style={styles.recordingIndicator}>
                <div style={styles.pulsingDot}></div>
                <span style={{ color: "#e74c3c", fontWeight: "600" }}>
                  {recordingTime}s
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Boutons de test */}
        <div style={styles.testButtons} className="test-buttons">
          <button
            onClick={testConnection}
            disabled={loading}
            style={{
              ...styles.testButton,
              ...styles.serverTestButton,
              opacity: loading ? 0.7 : 1,
            }}
            className="test-button"
          >
            🔍 Test Serveur
          </button>

          <button
            onClick={testModel}
            disabled={loading}
            style={{
              ...styles.testButton,
              ...styles.modelTestButton,
              opacity: loading ? 0.7 : 1,
            }}
            className="test-button"
          >
            🧠 Test Modèle
          </button>
        </div>

        {/* Zone d'affichage des messages */}
        <div style={styles.messagesSection}>
          {error && (
            <div style={{ ...styles.messageCard, ...styles.errorCard }}>
              <strong>❌ Erreur</strong>
              <br />
              {error}
            </div>
          )}

          {message && (
            <div style={{ ...styles.messageCard, ...styles.transcriptCard }}>
              <strong>💬 Transcription</strong>
              <br />
              {message}
            </div>
          )}

          {response && (
            <div style={{ ...styles.messageCard, ...styles.responseCard }}>
              <strong>🤖 Réponse de l'Assistant</strong>
              <br />
              {response}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={styles.instructionsSection}>
          <h3 style={styles.instructionsTitle}>💡 Guide d'utilisation</h3>
          <ul style={styles.instructionsList}>
            <li style={styles.instructionItem}>
              <strong>🎯</strong> Cliquez sur "Commencer l'enregistrement" et
              parlez clairement
            </li>
            <li style={styles.instructionItem}>
              <strong>⏱️</strong> L'enregistrement dure 6 secondes ou arrêtez-le
              manuellement
            </li>
            <li style={styles.instructionItem}>
              <strong>🎭</strong> Essayez : "Quelle heure est-il ?", "Bonjour",
              "Merci"
            </li>
            <li style={styles.instructionItem}>
              <strong>🔧</strong> Utilisez les boutons de test pour vérifier la
              configuration
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
