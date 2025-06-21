import React, { useState, useEffect, useRef } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

const OrangeMoneyAssistant = () => {
  const [balance, setBalance] = useState(null);
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [textInput, setTextInput] = useState("");
  const [currentAudioId, setCurrentAudioId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Charger les soldes au démarrage
  useEffect(() => {
    fetchBalance();
  }, []);

  // Auto-play audio when a new assistant message is added
  useEffect(() => {
    const lastMessage = chatHistory[chatHistory.length - 1];
    if (
      lastMessage &&
      lastMessage.type === "assistant" &&
      lastMessage.audioId &&
      !isPlaying
    ) {
      // Small delay to ensure the message is rendered
      setTimeout(() => {
        playAudio(lastMessage.audioId);
      }, 300);
    }
  }, [chatHistory]);

  // Gestion du timer et du countdown pour l'envoi automatique
  useEffect(() => {
    if (listening) {
      // Démarrer le countdown de 6 secondes
      setCountdown(6);

      // Timer pour l'envoi automatique après 6 secondes
      timerRef.current = setTimeout(() => {
        if (transcript.trim()) {
          handleVoiceSubmit();
        } else {
          stopListening();
        }
      }, 6000);

      // Décompte visuel
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Nettoyer les timers quand on arrête d'écouter
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      setCountdown(0);
    }

    // Cleanup à la destruction du composant
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [listening, transcript]);

  const fetchBalance = async () => {
    try {
      const res = await fetch("http://localhost:5000/solde");
      const data = await res.json();
      setBalance(data);
    } catch (err) {
      console.error("Erreur lors de la récupération du solde:", err);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
  };

  const sendMessage = async (message) => {
    if (!message.trim()) return;

    const userMessage = { type: "user", text: message, timestamp: new Date() };
    setChatHistory((prev) => [...prev, userMessage]);

    try {
      setLoading(true);
      setError("");

      const res = await fetch("http://localhost:5000/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erreur serveur");

      const assistantMessage = {
        type: "assistant",
        text: data.response,
        audioId: data.audio_id,
        timestamp: new Date(),
      };

      setChatHistory((prev) => [...prev, assistantMessage]);
      setCurrentAudioId(data.audio_id);

      // Actualiser les soldes après chaque transaction
      await fetchBalance();
    } catch (err) {
      setError(err.message);
      const errorMessage = {
        type: "error",
        text: `Erreur: ${err.message}`,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    sendMessage(textInput);
    setTextInput("");
  };

  const handleVoiceSubmit = () => {
    if (transcript.trim()) {
      sendMessage(transcript);
      resetTranscript();
    }
    stopListening();
  };

  const startListening = () => {
    resetTranscript();
    SpeechRecognition.startListening({ continuous: false, language: "fr-FR" });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
  };

  const playAudio = async (audioId) => {
    if (isPlaying) return;

    try {
      setIsPlaying(true);
      const audio = new Audio(`http://localhost:5000/audio/${audioId}`);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      await audio.play();
    } catch (err) {
      console.error("Erreur lecture audio:", err);
      setIsPlaying(false);
    }
  };

  const quickActions = [
    { label: "Mon solde", action: () => sendMessage("Quel est mon solde ?") },
    { label: "Historique", action: () => sendMessage("Montre mon historique") },
    { label: "Recharge crédit", action: () => sendMessage("Recharge crédit") },
    {
      label: "Forfait internet",
      action: () => sendMessage("Forfait internet"),
    },
  ];

  if (!browserSupportsSpeechRecognition) {
    return (
      <div style={styles.unsupportedContainer}>
        <div style={styles.unsupportedCard}>
          <div style={styles.warningIcon}>⚠️</div>
          <p style={styles.unsupportedText}>
            Votre navigateur ne supporte pas la reconnaissance vocale.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>
            <span style={styles.logoText}>OM</span>
          </div>
          <div>
            <h1 style={styles.title}>Orange Money Assistant</h1>
            <p style={styles.subtitle}>Votre assistant digital intelligent</p>
          </div>
        </div>
      </header>

      <div style={styles.mainContent}>
        {/* Soldes */}
        {balance && (
          <div style={styles.balanceGrid}>
            <div style={{ ...styles.balanceCard, borderLeftColor: "#f97316" }}>
              <div style={styles.balanceLabel}>Solde principal</div>
              <div style={styles.balanceValue}>
                {formatCurrency(balance.solde_principal)}
              </div>
            </div>
            <div style={{ ...styles.balanceCard, borderLeftColor: "#10b981" }}>
              <div style={styles.balanceLabel}>Crédit communication</div>
              <div style={styles.balanceValue}>
                {formatCurrency(balance.credit_communication)}
              </div>
            </div>
            <div style={{ ...styles.balanceCard, borderLeftColor: "#3b82f6" }}>
              <div style={styles.balanceLabel}>Internet</div>
              <div style={styles.balanceValue}>{balance.internet_mb} MB</div>
            </div>
            <div style={{ ...styles.balanceCard, borderLeftColor: "#8b5cf6" }}>
              <div style={styles.balanceLabel}>Bonus fidélité</div>
              <div style={styles.balanceValue}>
                {formatCurrency(balance.bonus_fidelite)}
              </div>
            </div>
          </div>
        )}

        {/* Actions rapides */}
        <div style={styles.quickActionsSection}>
          <h2 style={styles.sectionTitle}>Actions rapides</h2>
          <div style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                disabled={loading}
                style={{
                  ...styles.quickActionBtn,
                  opacity: loading ? 0.5 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Zone de conversation */}
        <div style={styles.chatContainer}>
          <div style={styles.chatHeader}>
            <h2 style={styles.chatTitle}>Conversation</h2>
            {isPlaying && (
              <div style={styles.audioIndicator}>
                <span style={styles.audioIcon}>🔊</span>
                <span style={styles.audioText}>Lecture en cours...</span>
              </div>
            )}
          </div>

          <div style={styles.chatMessages}>
            {chatHistory.length === 0 ? (
              <div style={styles.emptyChat}>
                <div style={styles.emptyChatIcon}>💬</div>
                <p>
                  Commencez votre conversation avec l'assistant Orange Money
                </p>
                <p style={styles.emptyChatSubtext}>
                  Dites ou écrivez votre demande en français
                </p>
              </div>
            ) : (
              chatHistory.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent:
                      msg.type === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      ...styles.messageBase,
                      ...(msg.type === "user"
                        ? styles.userMessage
                        : msg.type === "error"
                          ? styles.errorMessage
                          : styles.assistantMessage),
                    }}
                  >
                    <p style={styles.messageText}>{msg.text}</p>
                    {msg.audioId && (
                      <div style={styles.audioControls}>
                        <button
                          onClick={() => playAudio(msg.audioId)}
                          disabled={isPlaying}
                          style={{
                            ...styles.audioBtn,
                            opacity: isPlaying ? 0.5 : 1,
                          }}
                        >
                          {isPlaying ? "⏸️" : "🔊"} Rejouer
                        </button>
                        <span style={styles.autoPlayNote}>
                          Lecture automatique
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={styles.loadingMessage}>
                  <div style={styles.loadingContainer}>
                    <div style={styles.spinner}></div>
                    <span style={styles.loadingText}>
                      L'assistant réfléchit...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Zone de saisie */}
        <div style={styles.inputContainer}>
          {/* Reconnaissance vocale */}
          <div style={styles.voiceSection}>
            <div style={styles.voiceHeader}>
              <span style={styles.voiceTitle}>Reconnaissance vocale</span>
              <span
                style={{
                  ...styles.statusBadge,
                  ...(listening ? styles.listeningBadge : styles.inactiveBadge),
                }}
              >
                {listening ? `🎤 Écoute... ${countdown}s` : "⚫ Inactif"}
              </span>
            </div>

            {transcript && (
              <div style={styles.transcriptBox}>"{transcript}"</div>
            )}

            <div style={styles.voiceButtons}>
              <button
                onClick={startListening}
                disabled={listening || loading}
                style={{
                  ...styles.voiceBtn,
                  ...styles.primaryBtn,
                  opacity: listening || loading ? 0.5 : 1,
                }}
              >
                🎤 Parler
              </button>
              <button
                onClick={handleVoiceSubmit}
                disabled={!transcript || loading}
                style={{
                  ...styles.voiceBtn,
                  ...styles.successBtn,
                  opacity: !transcript || loading ? 0.5 : 1,
                }}
              >
                ✓ Envoyer maintenant
              </button>
            </div>

            {listening && (
              <div style={styles.autoSendInfo}>
                <span style={styles.autoSendText}>
                  📡 Envoi automatique dans {countdown} seconde
                  {countdown !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Saisie texte */}
          <div style={styles.textInputSection}>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Tapez votre message ici..."
              disabled={loading}
              onKeyPress={(e) => e.key === "Enter" && handleTextSubmit(e)}
              style={{
                ...styles.textInput,
                opacity: loading ? 0.5 : 1,
              }}
            />
            <button
              onClick={handleTextSubmit}
              disabled={!textInput.trim() || loading}
              style={{
                ...styles.sendBtn,
                opacity: !textInput.trim() || loading ? 0.5 : 1,
              }}
            >
              📤 Envoyer
            </button>
          </div>
        </div>

        {/* Erreurs */}
        {error && (
          <div style={styles.errorContainer}>
            <div style={styles.errorContent}>
              <span style={styles.errorIcon}>❌</span>
              <span style={styles.errorText}>{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <p style={styles.footerText}>
            © 2025 Orange Burkina Faso - Assistant Orange Money
          </p>
          <p style={styles.footerSubtext}>
            Votre partenaire digital de confiance
          </p>
        </div>
      </footer>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f9fafb",
  },
  unsupportedContainer: {
    minHeight: "100vh",
    backgroundColor: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
  },
  unsupportedCard: {
    backgroundColor: "white",
    borderRadius: "0.5rem",
    padding: "1.5rem",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
    maxWidth: "90%",
    width: "400px",
  },
  warningIcon: {
    color: "#ef4444",
    fontSize: "2.25rem",
    marginBottom: "1rem",
  },
  unsupportedText: {
    color: "#374151",
  },
  header: {
    backgroundColor: "#f97316",
    color: "white",
    padding: "1rem",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  },
  headerContent: {
    maxWidth: "1024px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    padding: "0 1rem",
  },
  logo: {
    width: "2rem",
    height: "2rem",
    backgroundColor: "white",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "0.75rem",
    flexShrink: 0,
  },
  logoText: {
    color: "#f97316",
    fontWeight: "bold",
    fontSize: "0.875rem",
  },
  title: {
    fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
    fontWeight: "bold",
    margin: 0,
  },
  subtitle: {
    color: "#fed7aa",
    fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
    margin: 0,
  },
  mainContent: {
    maxWidth: "1024px",
    margin: "0 auto",
    padding: "1rem",
  },
  balanceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  balanceCard: {
    backgroundColor: "white",
    borderRadius: "0.5rem",
    padding: "1rem",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    borderLeft: "4px solid",
    borderLeftColor: "#f97316",
    minWidth: 0,
  },
  balanceLabel: {
    fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
    color: "#6b7280",
    wordBreak: "break-word",
  },
  balanceValue: {
    fontSize: "clamp(0.875rem, 2.5vw, 1.125rem)",
    fontWeight: "bold",
    color: "#111827",
    wordBreak: "break-word",
  },
  quickActionsSection: {
    marginBottom: "1.5rem",
  },
  sectionTitle: {
    fontSize: "clamp(1rem, 2.5vw, 1.125rem)",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "0.75rem",
  },
  quickActionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(150px, 100%), 1fr))",
    gap: "0.75rem",
  },
  quickActionBtn: {
    backgroundColor: "white",
    border: "1px solid #d1d5db",
    borderRadius: "0.5rem",
    padding: "0.75rem",
    fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
    fontWeight: "500",
    color: "#374151",
    transition: "background-color 0.15s",
    cursor: "pointer",
    minWidth: 0,
    textAlign: "center",
  },
  chatContainer: {
    backgroundColor: "white",
    borderRadius: "0.5rem",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    marginBottom: "1rem",
  },
  chatHeader: {
    padding: "1rem",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "0.5rem",
  },
  chatTitle: {
    fontSize: "clamp(1rem, 2.5vw, 1.125rem)",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  },
  audioIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.875rem",
    color: "#f97316",
  },
  audioIcon: {
    fontSize: "1rem",
  },
  audioText: {
    fontWeight: "500",
  },
  chatMessages: {
    height: "clamp(300px, 50vh, 384px)",
    overflowY: "auto",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  emptyChat: {
    textAlign: "center",
    color: "#6b7280",
    paddingTop: "2rem",
    paddingBottom: "2rem",
  },
  emptyChatIcon: {
    fontSize: "2.25rem",
    marginBottom: "0.5rem",
  },
  emptyChatSubtext: {
    fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
    marginTop: "0.5rem",
  },
  messageBase: {
    maxWidth: "min(75%, 600px)",
    padding: "0.5rem 1rem",
    borderRadius: "0.5rem",
    wordBreak: "break-word",
  },
  userMessage: {
    backgroundColor: "#f97316",
    color: "white",
  },
  assistantMessage: {
    backgroundColor: "#f3f4f6",
    color: "#1f2937",
  },
  errorMessage: {
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    border: "1px solid #fecaca",
  },
  messageText: {
    fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
    margin: 0,
    lineHeight: "1.4",
  },
  audioControls: {
    marginTop: "0.5rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  audioBtn: {
    fontSize: "clamp(0.625rem, 1.5vw, 0.75rem)",
    backgroundColor: "#e5e7eb",
    padding: "0.25rem 0.5rem",
    borderRadius: "0.25rem",
    border: "none",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  autoPlayNote: {
    fontSize: "clamp(0.625rem, 1.5vw, 0.75rem)",
    color: "#6b7280",
    fontStyle: "italic",
  },
  loadingMessage: {
    backgroundColor: "#f3f4f6",
    borderRadius: "0.5rem",
    padding: "0.5rem 1rem",
    maxWidth: "min(75%, 600px)",
  },
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  spinner: {
    width: "1rem",
    height: "1rem",
    border: "2px solid #f97316",
    borderTop: "2px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
    color: "#6b7280",
  },
  inputContainer: {
    backgroundColor: "white",
    borderRadius: "0.5rem",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    padding: "1rem",
  },
  voiceSection: {
    marginBottom: "1rem",
    padding: "0.75rem",
    backgroundColor: "#f9fafb",
    borderRadius: "0.5rem",
  },
  voiceHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "0.5rem",
    flexWrap: "wrap",
    gap: "0.5rem",
  },
  voiceTitle: {
    fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
    fontWeight: "500",
    color: "#374151",
  },
  statusBadge: {
    fontSize: "clamp(0.625rem, 1.5vw, 0.75rem)",
    padding: "0.25rem 0.5rem",
    borderRadius: "0.25rem",
  },
  listeningBadge: {
    backgroundColor: "#fef2f2",
    color: "#991b1b",
  },
  inactiveBadge: {
    backgroundColor: "#e5e7eb",
    color: "#6b7280",
  },
  transcriptBox: {
    marginBottom: "0.75rem",
    padding: "0.5rem",
    backgroundColor: "white",
    borderRadius: "0.25rem",
    border: "1px solid #d1d5db",
    fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
    color: "#374151",
    wordBreak: "break-word",
  },
  voiceButtons: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(120px, 100%), 1fr))",
    gap: "0.5rem",
    marginBottom: "0.75rem",
  },
  voiceBtn: {
    minWidth: 0,
    padding: "0.5rem",
    borderRadius: "0.5rem",
    fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
    fontWeight: "500",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.15s",
    textAlign: "center",
  },
  primaryBtn: {
    backgroundColor: "#f97316",
    color: "white",
  },
  secondaryBtn: {
    backgroundColor: "#e5e7eb",
    color: "#374151",
  },
  successBtn: {
    backgroundColor: "#10b981",
    color: "white",
  },
  autoSendInfo: {
    textAlign: "center",
    padding: "0.5rem",
    backgroundColor: "#fef3c7",
    borderRadius: "0.25rem",
    border: "1px solid #fbbf24",
  },
  autoSendText: {
    fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
    color: "#92400e",
    fontWeight: "500",
  },
  textInputSection: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  textInput: {
    flex: 1,
    minWidth: "min(200px, 100%)",
    padding: "0.5rem 1rem",
    border: "1px solid #d1d5db",
    borderRadius: "0.5rem",
    outline: "none",
    fontSize: "clamp(0.875rem, 2vw, 1rem)",
  },
  sendBtn: {
    padding: "0.5rem 1.5rem",
    backgroundColor: "#f97316",
    color: "white",
    borderRadius: "0.5rem",
    fontWeight: "500",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.15s",
    fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
    whiteSpace: "nowrap",
  },
  errorContainer: {
    marginTop: "1rem",
    padding: "1rem",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "0.5rem",
  },
  errorContent: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.5rem",
  },
  errorIcon: {
    color: "#ef4444",
    flexShrink: 0,
  },
  errorText: {
    color: "#991b1b",
    fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
    lineHeight: "1.4",
    wordBreak: "break-word",
  },
  footer: {
    backgroundColor: "#1f2937",
    color: "white",
    padding: "1rem",
    marginTop: "2rem",
  },
  footerContent: {
    maxWidth: "1024px",
    margin: "0 auto",
    textAlign: "center",
    padding: "0 1rem",
  },
  footerText: {
    fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
    margin: 0,
  },
  footerSubtext: {
    fontSize: "clamp(0.625rem, 1.5vw, 0.75rem)",
    color: "#9ca3af",
    marginTop: "0.25rem",
    margin: 0,
  },
};

// Ajout de l'animation CSS pour le spinner
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @media (max-width: 640px) {
    .voice-buttons {
      grid-template-columns: 1fr;
    }
    
    .text-input-section {
      flex-direction: column;
    }
    
    .text-input-section input {
      width: 100%;
    }
  }
`;
document.head.appendChild(styleSheet);

export default OrangeMoneyAssistant;