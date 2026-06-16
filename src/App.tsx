/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Cephboy AI Coach v1.1.0 - Oracle de Motivation Trépidant et Rapide


import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Flame, 
  Heart, 
  Compass, 
  Play, 
  Square, 
  RefreshCw, 
  User, 
  MessageSquare, 
  Bookmark, 
  BookmarkCheck, 
  Copy,
  Check,
  Eye, 
  Quote, 
  ShieldAlert,
  Sliders,
  ChevronRight,
  TrendingUp,
  Award,
  Download
} from "lucide-react";
import { EpicAmbientSynth } from "./utils/synth";
import { playRawPCM, PlaybackSession, downloadPCMAsWav } from "./utils/pcmPlayer";

interface SavedMotivation {
  id: string;
  timestamp: string;
  name: string;
  state: string;
  text: string;
  victorySentence: string;
}

const PRESET_STATES = [
  { id: "exhausted", label: "Physiquement et mentalement épuisé", description: "Pour surmonter un coup de mou ou un fardeau mental extrême.", icon: Compass },
  { id: "discouraged", label: "Démotivé et invisible", description: "Pour relancer la machine quand tes efforts passent inaperçus.", icon: Heart },
  { id: "crossroads", label: "Devant un choix crucial", description: "Pour dissiper le doute, vaincre la peur de l'inconnu et passer à l'action.", icon: Sparkles },
  { id: "broken", label: "K.O. par un échec", description: "Pour transformer tes cicatrices en force et te reconstruire de manière implacable.", icon: Flame },
  { id: "guerre", label: "Prêt pour le défi de ta vie", description: "Pour doper ton adrénaline avant un examen, une compétition ou une épreuve importante.", icon: Award }
];

export default function App() {
  // Input states
  const [userName, setUserName] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("exhausted");
  const [customContext, setCustomContext] = useState<string>("");
  const [voiceGender, setVoiceGender] = useState<"male" | "female">("male");

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"coach" | "journal">("coach");

  // Motivation Output states
  const [motivationText, setMotivationText] = useState<string>("");
  const [victorySentence, setVictorySentence] = useState<string>("");
  const [currentAudioBase64, setCurrentAudioBase64] = useState<string | null>(null);

  // Synth state (Client-side ambient music)
  const [ambientSynth] = useState(() => new EpicAmbientSynth());
  const [isSynthPlaying, setIsSynthPlaying] = useState<boolean>(false);

  // Audio Playback states for Coach TTS
  const [playbackSession, setPlaybackSession] = useState<PlaybackSession | null>(null);
  const [isVoicePlaying, setIsVoicePlaying] = useState<boolean>(false);
  const [activeParagraphIndex, setActiveParagraphIndex] = useState<number | null>(null);
  const [isParagraphLoading, setIsParagraphLoading] = useState<boolean>(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState<boolean>(false);

  // Saved motivations
  const [savedMotivations, setSavedMotivations] = useState<SavedMotivation[]>([]);
  const [isCurrentSaved, setIsCurrentSaved] = useState<boolean>(false);

  // Active section scrolling
  const resultRef = useRef<HTMLDivElement>(null);

  // Trigger ambient synth warning
  const [showSynthTip, setShowSynthTip] = useState<boolean>(true);

  // Copy state
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Copy sermon to clipboard
  const handleCopy = () => {
    if (!motivationText) return;
    const fullTextToCopy = `CEPHBOY AI COACH - MOTIVATION CINÉMATIQUE\n\n"${victorySentence}"\n\n${motivationText}`;
    navigator.clipboard.writeText(fullTextToCopy).then(() => {
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }).catch(err => {
      console.error("Unable to copy", err);
    });
  };

  // Load Saved Motivations
  useEffect(() => {
    const saved = localStorage.getItem("cephboy_journal");
    if (saved) {
      try {
        setSavedMotivations(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Sync state transitions on step loading
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep(prev => {
          if (prev >= 3) {
            return 3;
          }
          return prev + 1;
        });
      }, 3200);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Handle ambient synth toggling
  const toggleAmbientSynth = () => {
    if (isSynthPlaying) {
      ambientSynth.stop();
      setIsSynthPlaying(false);
    } else {
      ambientSynth.start();
      setIsSynthPlaying(true);
      setShowSynthTip(false);
    }
  };

  // Stop vocal speech playback if active
  const stopVoice = () => {
    if (playbackSession) {
      playbackSession.stop();
      setPlaybackSession(null);
    }
    setIsVoicePlaying(false);
    setActiveParagraphIndex(null);
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      ambientSynth.stop();
      if (playbackSession) {
        playbackSession.stop();
      }
    };
  }, []);

  // Generate deep emotional motivation
  const handleMotivateMe = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    stopVoice();
    setIsLoading(true);
    setLoadingStep(0);
    setIsCurrentSaved(false);

    // Auto-initiate ambient soundscape if not playing for complete emotional immersion
    if (!isSynthPlaying) {
      try {
        ambientSynth.start();
        setIsSynthPlaying(true);
        setShowSynthTip(false);
      } catch (err) {
        console.log("Could not auto-start audio node due to browser gesture limitation.");
      }
    }

    try {
      const stateLabel = PRESET_STATES.find(s => s.id === selectedState)?.label || "Inconnu";
      const response = await fetch("/api/motivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: userName || "Champion",
          userState: stateLabel,
          customContext: customContext,
          voiceGender: voiceGender
        })
      });

      if (!response.ok) {
        throw new Error("La connexion avec le coach AI a échoué.");
      }

      const data = await response.json();
      setMotivationText(data.text);
      setVictorySentence(data.victorySentence);
      setCurrentAudioBase64(null); // Clear previous voice audio
      setShowResult(true);

      // Scroll into view instantly so they can read the text immediately
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);

      // Start lazy background TTS loading to keep the response lightning fast
      setIsVoiceLoading(true);
      fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: data.victorySentence, voiceGender: voiceGender })
      })
      .then((ttsRes) => {
        if (!ttsRes.ok) throw new Error();
        return ttsRes.json();
      })
      .then((ttsData) => {
        if (ttsData.audioBase64) {
          setCurrentAudioBase64(ttsData.audioBase64);
          // Play the voice automatically with a short delay for great cinema impact!
          setTimeout(() => {
            triggerVoicePlayback(ttsData.audioBase64, "sentence");
          }, 300);
        }
      })
      .catch((err) => {
        console.error("Background voice synthesis failed:", err);
      })
      .finally(() => {
        setIsVoiceLoading(false);
      });

    } catch (err) {
      console.error(err);
      alert("Une ombre passagère a perturbé la connexion avec Cephboy. Veuillez retenter.");
    } finally {
      setIsLoading(false);
    }
  };

  // Base64 PCM Player trigger
  const triggerVoicePlayback = (base64Data: string, mode: "sentence" | "paragraph", pIndex: number | null = null) => {
    stopVoice();
    setIsVoicePlaying(true);
    if (pIndex !== null) {
      setActiveParagraphIndex(pIndex);
    }

    const session = playRawPCM(base64Data, 24000, () => {
      setIsVoicePlaying(false);
      setActiveParagraphIndex(null);
      setPlaybackSession(null);
    });

    if (session) {
      setPlaybackSession(session);
    } else {
      setIsVoicePlaying(false);
      setActiveParagraphIndex(null);
    }
  };

  // Custom live paragraph synthesis on user demand
  const handleSynthesizeParagraph = async (textToSpeak: string, index: number) => {
    if (isParagraphLoading || (activeParagraphIndex === index && isVoicePlaying)) {
      stopVoice();
      return;
    }

    stopVoice();
    setIsParagraphLoading(true);
    setActiveParagraphIndex(index);

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSpeak, voiceGender: voiceGender })
      });

      if (!response.ok) throw new Error();

      const data = await response.json();
      if (data.audioBase64) {
        setIsParagraphLoading(false);
        triggerVoicePlayback(data.audioBase64, "paragraph", index);
      } else {
        throw new Error();
      }
    } catch (err) {
      setIsParagraphLoading(false);
      setActiveParagraphIndex(null);
      alert("La voix céleste n'a pas pu s'éveiller. Réessayez dans un court instant.");
    }
  };

  // Save to visual Journal
  const handleSaveToJournal = () => {
    if (!motivationText || isCurrentSaved) return;

    const newSaved: SavedMotivation = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit"
      }),
      name: userName || "Champion",
      state: PRESET_STATES.find(s => s.id === selectedState)?.label || "Défi suprême",
      text: motivationText,
      victorySentence: victorySentence
    };

    const updated = [newSaved, ...savedMotivations];
    setSavedMotivations(updated);
    localStorage.setItem("cephboy_journal", JSON.stringify(updated));
    setIsCurrentSaved(true);
  };

  // Remove item from journal
  const handleRemoveFromJournal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedMotivations.filter(x => x.id !== id);
    setSavedMotivations(updated);
    localStorage.setItem("cephboy_journal", JSON.stringify(updated));
  };

  // View historical motivation
  const handleLoadHistorical = (item: SavedMotivation) => {
    stopVoice();
    setMotivationText(item.text);
    setVictorySentence(item.victorySentence);
    setCurrentAudioBase64(null); // Clear direct base64 since it is older
    setUserName(item.name);
    setShowResult(true);
    setActiveTab("coach");
    // Scroll
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  // Parse custom styled text format
  const getParagraphs = (rawText: string) => {
    return rawText
      .split("\n")
      .map(p => p.trim())
      .filter(p => p.length > 0);
  };

  // Loading Screen Steps messages
  const LOADING_MESSAGES = [
    "Cephboy écoute ton souffle et tes fardeaux...",
    "Étouffement des bruits du monde extérieur...",
    "Forger la parole herculéenne dans l'âtre de la douleur...",
    "Libération de la force innomée... tiens-toi prêt à renaître."
  ];

  return (
    <div id="cephboy_app_root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Dynamic Cosmic Ambient Aura */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-amber-500/5 mix-blend-screen filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] rounded-full bg-amber-600/5 mix-blend-screen filter blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-10 left-1/4 w-80 h-80 rounded-full bg-slate-800/10 mix-blend-screen filter blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Floating Spatial Header / Stat rail */}
      <header id="spatial_header" className="relative z-10 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 px-4 py-3.5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center border border-red-500/25 bg-slate-950 shadow-md shadow-red-500/25 transition-transform hover:scale-105 duration-300">
                <div className="w-full h-full bg-slate-950 flex items-center justify-center border border-red-500/50 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent"></div>
                  <Flame className="w-5 h-5 text-red-500 fill-red-500/20 animate-pulse" />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
            <div>
              <h1 className="font-display text-lg font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 uppercase">
                Cephboy AI Coach
              </h1>
              <p className="font-mono text-[9.5px] text-amber-500/60 uppercase tracking-widest flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-amber-500" /> Le Maître de l'Éveil Émotionnel v1.1.0
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Ambient Synth Controller */}
            <button
              id="ambient_synth_button"
              onClick={toggleAmbientSynth}
              className={`flex items-center gap-2.5 px-4 py-1.5 rounded-full font-mono text-xs border transition-all duration-300 ${
                isSynthPlaying 
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-sm shadow-amber-500/10" 
                  : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700"
              }`}
            >
              {isSynthPlaying ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                  <span>AMBIANCE CINÉMATIQUE ACTIVÉE</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>ACTIVER L'AMBIANCE SONORE</span>
                </>
              )}
            </button>

            {/* Navigation Tabs */}
            <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex">
              <button
                id="tab_coach"
                onClick={() => setActiveTab("coach")}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === "coach" 
                    ? "bg-slate-800 text-amber-400 shadow-sm" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                L'Autel du Coach
              </button>
              <button
                id="tab_journal"
                onClick={() => setActiveTab("journal")}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === "journal" 
                    ? "bg-slate-800 text-amber-400 shadow-sm" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Bookmark className="w-3 h-3 text-amber-500" />
                <span>Journal ({savedMotivations.length})</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Hero Visual Banner */}
      <section id="hero_banner" className="relative z-10 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 border-b border-slate-900 pt-16 pb-12 text-center px-4 overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none"></div>
        
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full font-mono text-[10.5px] tracking-wide text-amber-500">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
            <span>UN DIALOGUE DIRECT ENTRE DEUX ÂMES SENSESS</span>
          </div>
          
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-wider text-slate-100 leading-tight">
            OSER REPOSER LE GENOU,<br />
            MAIS <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">NE JAMAIS ABDIQUER.</span>
          </h2>
          
           <p className="text-slate-400 text-sm max-w-lg mx-auto font-sans leading-relaxed">
            Cephboy AI Coach n'est pas un conseiller ordinaire. 
            Il cible tes doutes réels, t'apporte la rigueur mentale nécessaire et te pousse à agir immédiatement avec la force d'un discours de cinéma.
          </p>

          {showSynthTip && (
            <div className="p-3 bg-amber-500/5 max-w-md mx-auto rounded-xl border border-amber-500/10 text-xs text-amber-300 flex items-center justify-center gap-3">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <p>
                <strong>Conseil d'immersion :</strong> Active <strong>l'Ambiance Sonore</strong> en haut à droite avant de lancer la motivation pour une immersion digne des plus grands films.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Main interactive area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column or Active Tab View */}
        <div className="col-span-1 lg:col-span-12">
          
          {activeTab === "journal" ? (
            /* JOURNAL TAB */
            <section id="journal_section" className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-900">
                <div>
                  <h3 className="font-display text-xl font-bold text-amber-400 tracking-wider">
                    JOURNAL DES ÉPREUVES ET DES VICTOIRES
                  </h3>
                  <p className="text-xs text-slate-400">
                    Retrouve ici les discours marquants et les paroles impactantes enregistrés au cours de ton parcours.
                  </p>
                </div>
                <div role="status" className="font-mono text-xs text-slate-500">
                  {savedMotivations.length} sauvegarde{savedMotivations.length > 1 ? 's' : ''}
                </div>
              </div>

              {savedMotivations.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/40 border border-slate-900 rounded-2xl space-y-4 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-full bg-slate-850 mx-auto flex items-center justify-center text-slate-500">
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-slate-300 font-medium">Le parchemin est vide</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Une fois que le Coach t'aura motivé de sa voix puissante, tu pourras immortaliser ses mots en cliquant sur le bouton de sauvegarde.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("coach")}
                    className="px-4 py-2 bg-slate-800 text-xs font-semibold text-amber-400 rounded-lg border border-slate-700 hover:bg-slate-750 transition"
                  >
                    Demander une Motivation
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedMotivations.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => handleLoadHistorical(item)}
                      className="group p-5 rounded-2xl bg-slate-900/50 border border-slate-900 hover:border-amber-500/20 hover:bg-slate-900 transition-all duration-300 cursor-pointer flex flex-col justify-between spacing-y-4 relative"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                          <span className="bg-slate-950 px-2.5 py-0.5 rounded text-amber-500 border border-slate-850">
                            {item.state}
                          </span>
                          <span>{item.timestamp}</span>
                        </div>
                        
                        <h4 className="font-display text-sm font-semibold text-slate-200 group-hover:text-amber-300 transition-colors">
                          Parole pour {item.name}
                        </h4>

                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed font-sans italic">
                          " {item.text} "
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-950 pt-3 mt-4">
                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                          <Quote className="w-3 h-3 text-amber-500" /> Relire le Sermon
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFromJournal(item.id, e);
                            }}
                            className="p-1 px-2 text-[10px] text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded transition font-mono"
                            title="Effacer ce souvenir"
                          >
                            Effacer
                          </button>
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-500 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : (
            /* MAIN COACH AUTEL TAB */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Form Input Section */}
              <div className="lg:col-span-5 space-y-6">
                
                <h3 className="font-display text-xl font-semibold text-amber-400 tracking-wider border-b border-slate-900 pb-3 h-9 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-500" /> Configurer l'Épreuve
                </h3>

                <form onSubmit={handleMotivateMe} className="space-y-6 bg-slate-900/30 p-6 rounded-2xl border border-slate-900">
                  
                  {/* Name field */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-amber-500" />
                      <span>Quel est ton prénom ?</span>
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Ex: Sébastien, Valérie, Champion..."
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500/40 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition font-sans shadow-inner focus:ring-1 focus:ring-amber-500/20"
                    />
                  </div>

                  {/* Voice Gender Selection */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                      <span>Voix du Coach</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setVoiceGender("male")}
                        className={`py-2.5 px-4 rounded-xl border text-center font-sans font-medium text-xs transition-all duration-300 flex items-center justify-center gap-2 outline-none ${
                          voiceGender === "male"
                            ? "bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-inner"
                            : "bg-slate-950/80 border-slate-800 hover:bg-slate-900/40 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <User className="w-3.5 h-3.5 text-amber-500" />
                        <span>Voix Homme</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setVoiceGender("female")}
                        className={`py-2.5 px-4 rounded-xl border text-center font-sans font-medium text-xs transition-all duration-300 flex items-center justify-center gap-2 outline-none ${
                          voiceGender === "female"
                            ? "bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-inner"
                            : "bg-slate-950/80 border-slate-800 hover:bg-slate-900/40 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <User className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Voix Femme</span>
                      </button>
                    </div>
                  </div>

                  {/* Soul State Presets */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
                      À quel défi fais-tu face en ce moment ?
                    </label>
                    
                    <div className="space-y-2">
                      {PRESET_STATES.map((state) => {
                        const IconComponent = state.icon;
                        const isSelected = selectedState === state.id;
                        return (
                          <div
                            key={state.id}
                            onClick={() => setSelectedState(state.id)}
                            className={`group p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-350 flex items-start gap-3.5 ${
                              isSelected 
                                ? "bg-amber-500/5 border-amber-500/30 text-amber-100 shadow-sm shadow-amber-500/5" 
                                : "bg-slate-950/40 border-slate-850 hover:bg-slate-900/40 hover:border-slate-800 text-slate-400"
                            }`}
                          >
                            <div className={`p-2 rounded-lg mt-0.5 transition-colors ${
                              isSelected 
                                ? "bg-amber-500/10 text-amber-400" 
                                : "bg-slate-900 text-slate-500 group-hover:text-slate-300"
                            }`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-xs font-semibold ${isSelected ? "text-amber-300" : "text-slate-300"}`}>
                                {state.label}
                              </h4>
                              <p className="text-[11px] text-slate-500 group-hover:text-slate-400 mt-0.5 leading-relaxed font-sans">
                                {state.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Deep intimate description */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono text-slate-400 uppercase tracking-wider">
                      <label className="flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                        <span>Contexte personnel (Facultatif)</span>
                      </label>
                      <span className="text-[10px] text-slate-600">Défis spécifiques</span>
                    </div>
                    
                    <textarea
                      value={customContext}
                      onChange={(e) => setCustomContext(e.target.value)}
                      placeholder="Décris brièvement la situation, l'obstacle ou l'objectif précis auquel tu fais face actuellement..."
                      rows={4}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500/40 rounded-xl px-4 py-3 text-xs text-slate-300 placeholder:text-slate-700 outline-none transition font-sans resize-none shadow-inner focus:ring-1 focus:ring-amber-500/20 leading-relaxed"
                    />
                  </div>

                  {/* Trigger Action Button */}
                  <div className="pt-2">
                    <button
                      id="motivate_trigger_button"
                      type="submit"
                      disabled={isLoading}
                      className="relative w-full group/btn overflow-hidden rounded-xl bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 p-[1px] focus:outline-none transition-all hover:shadow-lg hover:shadow-amber-500/10 active:scale-[0.99] disabled:opacity-50"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 rounded-xl blur opacity-30 group-hover/btn:opacity-65 transition-opacity"></span>
                      <div className="relative bg-slate-950 py-4 px-6 rounded-[11px] text-slate-100 flex items-center justify-center gap-3.5 group-hover/btn:bg-slate-950/80 transition-colors">
                        <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
                        <span className="font-display text-sm font-bold tracking-widest text-slate-200 group-hover/btn:text-amber-200 transition-colors uppercase">
                          MOTIVE-MOI
                        </span>
                      </div>
                    </button>
                    
                    <p className="text-[10px] text-slate-600 text-center font-mono mt-3">
                      Prépare-toi à un regain d'adrénaline. Ressens l'impact d'une motivation brute et implacable.
                    </p>
                  </div>

                </form>

              </div>

              {/* Right Column / Results & Interaction Panel */}
              <div className="lg:col-span-7 space-y-6">
                
                <h3 className="font-display text-xl font-semibold text-amber-400 tracking-wider border-b border-slate-900 pb-3 h-9 flex items-center gap-2">
                  <Quote className="w-5 h-5 text-amber-500" /> La Parole de Cephboy
                </h3>

                {/* LOADING SCREEN WITH MULTI-STEP POETRY */}
                {isLoading && (
                  <div className="min-h-[480px] bg-slate-900/20 border border-slate-900 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-8 animate-pulse">
                    
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 relative z-10 animate-spin" style={{ animationDuration: '6s' }}>
                        <Flame className="w-10 h-10 animate-pulse" />
                      </div>
                      <div className="absolute inset-0 rounded-2xl w-20 h-20 bg-amber-500/20 filter blur-xl animate-ping scale-75"></div>
                    </div>

                    <div className="space-y-4 max-w-sm">
                      <h4 className="font-display text-lg text-slate-200 tracking-wider">
                        LA FORGE EST EN ACTION
                      </h4>
                      
                      <div className="h-6 overflow-hidden relative">
                        <p className="text-[13px] text-amber-400 font-mono tracking-wider transition-all duration-500">
                          {LOADING_MESSAGES[loadingStep]}
                        </p>
                      </div>

                      <div className="w-48 bg-slate-950 h-1 rounded-full overflow-hidden mx-auto border border-slate-850">
                        <div 
                          className="bg-gradient-to-r from-amber-600 to-amber-300 h-full rounded-full transition-all duration-3000 ease-in-out"
                          style={{ width: `${(loadingStep + 1) * 25}%` }}
                        ></div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 italic max-w-xs leading-relaxed">
                      "Dans le silence de l'abîme réside la plus pure forme de ta lumière. Ne crains pas les larmes, elles nettoient ton regard."
                    </p>

                  </div>
                )}

                {/* NO RESULTS YET LAYOUT */}
                {!isLoading && !showResult && (
                  <div className="min-h-[480px] bg-slate-900/10 border border-dashed border-slate-900/60 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-slate-600">
                      <MessageSquare className="w-8 h-8" />
                    </div>
                    
                    <div className="max-w-xs space-y-2">
                      <h4 className="font-display text-sm font-semibold text-slate-300">
                        Ton coach est prêt
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-sans">
                        Saisis ton prénom, sélectionne ton défi ou décris ton objectif, puis clique sur <span className="text-amber-400">Motive-Moi</span> pour générer ton boost mental.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => handleMotivateMe()}
                        className="py-2 px-5 rounded-lg bg-slate-900 hover:bg-slate-850 hover:text-amber-400 transition text-[11px] font-mono border border-slate-850 flex items-center gap-2 text-slate-400"
                      >
                        <span>Motivation instantanée</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* BEAUTIFIED GENERATED SOLUTION CARD */}
                {!isLoading && showResult && (
                  <div 
                    ref={resultRef}
                    className="space-y-6 animate-fadeIn"
                  >
                    
                    {/* The Climax Speech Player Box */}
                    <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 rounded-3xl border border-amber-500/25 shadow-2xl space-y-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full filter blur-2xl pointer-events-none"></div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${
                            isVoicePlaying 
                              ? "bg-amber-500/20 border-amber-400/40 text-amber-300 animate-pulse shadow-inner" 
                              : "bg-slate-950 border-slate-800 text-slate-400"
                          }`}>
                            <Volume2 className={`w-5 h-5 ${isVoicePlaying ? "animate-bounce" : ""}`} />
                          </div>
                          <div>
                            <span className="font-mono text-[9px] text-amber-500 uppercase tracking-widest">
                              DISCOURS DE MOTIVATION
                            </span>
                            <h4 className="font-display text-sm font-semibold text-slate-200">
                              Motivation Cinématique
                            </h4>
                          </div>
                        </div>

                        {/* Top controls: Stop / Save / Close */}
                        <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
                          {isVoiceLoading && (
                            <div className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                              <span>VOIX EN COURS DE FORGE...</span>
                            </div>
                          )}

                          {!isVoiceLoading && currentAudioBase64 && (
                            <button
                              id="btn_play_climax"
                              onClick={() => triggerVoicePlayback(currentAudioBase64, "sentence")}
                              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/10 active:scale-95"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>ÉCOUTER LA VOIX</span>
                            </button>
                          )}

                          {!isVoiceLoading && currentAudioBase64 && (
                            <button
                              onClick={() => downloadPCMAsWav(currentAudioBase64, `cephboy-motivation-${userName || "champion"}.wav`)}
                              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-amber-400 text-xs font-mono transition-all active:scale-95"
                              title="Télécharger l'audio au format WAV"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>TÉLÉCHARGER</span>
                            </button>
                          )}
                          
                          {isVoicePlaying && (
                            <button
                              onClick={stopVoice}
                              className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-red-400/30 hover:text-red-400 text-slate-500 transition"
                              title="Taire le Coach"
                            >
                              <Square className="w-4 h-4 fill-current" />
                            </button>
                          )}

                          <button
                            onClick={handleSaveToJournal}
                            disabled={isCurrentSaved}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-mono transition-all ${
                              isCurrentSaved 
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                : "bg-slate-950 border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-amber-400"
                            }`}
                          >
                            {isCurrentSaved ? (
                              <>
                                <BookmarkCheck className="w-3.5 h-3.5" />
                                <span>CONSERVÉ</span>
                              </>
                            ) : (
                              <>
                                <Bookmark className="w-3.5 h-3.5" />
                                <span>GRAVER</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={handleCopy}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-mono transition-all bg-slate-950 border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-amber-400`}
                            title="Copier la motivation"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">COPIÉ !</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>COPIER</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Unified short, beautiful display of Motivation */}
                      <div className="bg-slate-950/60 p-6 sm:p-8 rounded-2xl border border-slate-850/60 relative my-2">
                        <Quote className="absolute top-3 left-3 w-10 h-10 text-slate-900/60 pointer-events-none" />
                        <p className="font-display text-base sm:text-lg font-semibold text-amber-300 italic pl-10 pr-6 leading-relaxed tracking-wide text-center">
                          "{victorySentence}"
                        </p>
                      </div>

                      {/* Footer Actions inside Result view */}
                      <div className="pt-4 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
                        
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                          <Eye className="w-4 h-4 text-amber-500/70" />
                          <span>Prends de grandes inspirations lentes.</span>
                        </div>

                        <button
                          onClick={() => {
                            stopVoice();
                            setShowResult(false);
                            setCustomContext("");
                          }}
                          className="w-full sm:w-auto px-4 py-2 border border-slate-850 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 rounded-xl text-xs font-mono text-slate-300 hover:text-slate-100 transition whitespace-nowrap"
                        >
                          Nouveau discours de motivation
                        </button>

                      </div>

                    </div>

                  </div>
                )}

              </div>

            </div>
          )}

        </div>

      </main>

      {/* Footer warning / info */}
      <footer id="master_footer" className="relative z-10 border-t border-slate-900 bg-slate-950/40 py-8 px-4 mt-16">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          
          <div className="space-y-1">
            <p className="font-mono text-xs text-slate-400">
              Cephboy AI Coach © 2026 • L'Artiste Éveilleur
            </p>
            <p className="text-[11px] text-slate-600">
              Chaque parole est forgée à la commande pour redonner force et fierté. Les émotions fortes et les larmes libérées sont des réactions spirituelles attendues.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <a 
              href="#cephboy_app_root" 
              className="font-mono text-[10.5px] text-slate-500 hover:text-slate-300 transition uppercase tracking-wider"
            >
              Vers le sommet ▲
            </a>
          </div>

        </div>
      </footer>

    </div>
  );
}
