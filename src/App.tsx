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
  Download,
  Globe
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
  voiceGender?: "male" | "female";
  language?: string;
}

const PRESET_STATES = [
  { id: "exhausted", label: "Physically and mentally exhausted", description: "To overcome a slump or an extreme mental burden.", icon: Compass },
  { id: "discouraged", label: "Demotivated and invisible", description: "To get the engine running again when your efforts go unnoticed.", icon: Heart },
  { id: "crossroads", label: "At a crucial crossroads", description: "To dispel doubt, conquer the fear of the unknown, and take action.", icon: Sparkles },
  { id: "broken", label: "K.O. by failure", description: "To transform your scars into strength and rebuild yourself relentlessly.", icon: Flame },
  { id: "guerre", label: "Ready for the challenge of your life", description: "To boost your adrenaline before an exam, a competition, or a major test.", icon: Award }
];

const LANGUAGES = [
  { code: "English", label: "English", flag: "🇺🇸" },
  { code: "French", label: "Français", flag: "🇫🇷" },
  { code: "Spanish", label: "Español", flag: "🇪🇸" },
  { code: "German", label: "Deutsch", flag: "🇩🇪" },
  { code: "Italian", label: "Italiano", flag: "🇮🇹" },
  { code: "Portuguese", label: "Português", flag: "🇵🇹" },
  { code: "Arabic", label: "العربية", flag: "🇸🇦" },
  { code: "Japanese", label: "日本語", flag: "🇯🇵" }
];

const UI_TEXTS: Record<string, Record<string, string>> = {
  English: {
    tagline: "The Master of Emotional Awakening v1.1.0",
    ambiance_on: "CINEMATIC AMBIANCE ACTIVE",
    ambiance_off: "ACTIVATE SOUND AMBIANCE",
    tab_coach: "The Coach's Altar",
    tab_journal: "Journal",
    banner_badge: "A DIRECT DIALOGUE BETWEEN TWO INTENSE SOULS",
    banner_title_1: "DARE TO REST YOUR KNEE,",
    banner_title_2: "BUT NEVER SURRENDER.",
    banner_desc: "Cephboy AI Coach is no ordinary advisor. He targets your real doubts, brings you the needed mental toughness, and pushes you to act immediately with the raw power of a cinematic speech.",
    synth_tip_title: "Immersion Tip:",
    synth_tip_desc: "Activate the Sound Ambiance at the top right before starting the motivation for an experience worthy of the greatest movies.",
    journal_title: "JOURNAL OF TRIALS AND VICTORIES",
    journal_desc: "Find here the outstanding speeches and powerful quotes recorded during your journey.",
    journal_count: "saving",
    journal_count_plural: "savings",
    journal_empty_title: "The scroll is empty",
    journal_empty_desc: "Once the Coach has motivated you with his powerful voice, you can immortalize his words by clicking the save button.",
    btn_request_motivation: "Request Motivation",
    saved_caption_for: "Speech for",
    read_sermon: "Re-read the Sermon",
    delete: "Delete",
    configure_trial: "Configure the Trial",
    label_name: "What is your name?",
    placeholder_name: "e.g. Sebastian, Valerie, Champion...",
    label_voice: "Coach's Voice",
    voice_male: "Male Voice",
    voice_female: "Female Voice",
    label_lang_title: "Motivation Language",
    label_state_prompt: "What challenge are you facing right now?",
    label_custom_context: "Personal Context (Optional)",
    context_badge: "Specific challenges",
    placeholder_custom_context: "Briefly describe the situation, obstacle, or precise goal you are currently facing...",
    btn_motivate: "MOTIVATE ME",
    under_btn: "Get ready for a rush of adrenaline. Feel the impact of raw and relentless motivation.",
    result_title: "Cephboy's Word",
    loading_title: "THE FORGE IS IN ACTION",
    loading_quote: "In the silence of the abyss lies the purest form of your light. Do not fear tears, they wash clean your gaze.",
    ready_title: "Your coach is ready",
    ready_desc: "Enter your name, select your challenge or describe your goal, then click Motivate Me to generate your mental boost.",
    btn_instant_motivation: "Instant motivation",
    speech_gender_male: "MALE",
    speech_gender_female: "FEMALE",
    speech_loading_audio: "FORGING VOICE...",
    speech_btn_play: "LISTEN TO VOICE",
    speech_btn_download: "DOWNLOAD",
    speech_btn_save_un: "ENGRAVE",
    speech_btn_save_ok: "ENGRAVED",
    speech_btn_copy: "COPY",
    speech_btn_copied: "COPIED!",
    breath_tip: "Take deep, slow breaths.",
    btn_new_speech: "New motivation speech",
    footer_copyright: "Cephboy AI Coach © 2026 • The Awakening Artist",
    footer_desc: "Every word is forged to order to restore strength and pride. Strong emotions and released tears are expected spiritual reactions.",
    footer_summit: "To the summit ▲",
    alert_error: "A passing shadow has disrupted the connection with Cephboy. Please try again.",
    
    // States
    state_exhausted_lbl: "Physically and mentally exhausted",
    state_exhausted_desc: "To overcome a slump or an extreme mental burden.",
    state_discouraged_lbl: "Demotivated and invisible",
    state_discouraged_desc: "To get the engine running again when your efforts go unnoticed.",
    state_crossroads_lbl: "At a crucial crossroads",
    state_crossroads_desc: "To dispel doubt, conquer the fear of the unknown, and take action.",
    state_broken_lbl: "K.O. by failure",
    state_broken_desc: "To transform your scars into strength and rebuild yourself relentlessly.",
    state_guerre_lbl: "Ready for the challenge of your life",
    state_guerre_desc: "To boost your adrenaline before an exam, a competition, or a major test.",

    // Loading steps
    loading_step_0: "Cephboy listens to your breath and your burdens...",
    loading_step_1: "Shedding the noise of the outside world...",
    loading_step_2: "Forging herculean words in the hearth of pain...",
    loading_step_3: "Releasing the unnamed force... ready yourself to be reborn."
  },
  French: {
    tagline: "Le Maître de l'Éveil Émotionnel v1.1.0",
    ambiance_on: "AMBIANCE CINÉMATIQUE ACTIVÉE",
    ambiance_off: "ACTIVER L'AMBIANCE SONORE",
    tab_coach: "L'Autel du Coach",
    tab_journal: "Journal",
    banner_badge: "UN DIALOGUE DIRECT ENTRE DEUX ÂMES INTENSES",
    banner_title_1: "OSER REPOSER LE GENOU,",
    banner_title_2: "MAIS NE JAMAIS ABDIQUER.",
    banner_desc: "Cephboy AI Coach n'est pas un conseiller ordinaire. Il cible tes doutes réels, t'apporte la rigueur mentale nécessaire et te pousse à agir immédiatement avec la force d'un discours de cinéma.",
    synth_tip_title: "Conseil d'immersion :",
    synth_tip_desc: "Active l'Ambiance Sonore en haut à droite avant de lancer la motivation pour une immersion digne des plus grands films.",
    journal_title: "JOURNAL DES ÉPREUVES ET DES VICTOIRES",
    journal_desc: "Retrouve ici les discours marquants et les paroles impactantes enregistrés au cours de ton parcours.",
    journal_count: "sauvegarde",
    journal_count_plural: "sauvegardes",
    journal_empty_title: "Le parchemin est vide",
    journal_empty_desc: "Une fois que le Coach t'aura motivé de sa voix puissante, tu pourras immortaliser ses mots en cliquant sur le bouton de sauvegarde.",
    btn_request_motivation: "Demander une Motivation",
    saved_caption_for: "Parole pour",
    read_sermon: "Relire le Sermon",
    delete: "Effacer",
    configure_trial: "Configurer l'Épreuve",
    label_name: "Quel est ton prénom ?",
    placeholder_name: "Ex: Sébastien, Valérie, Champion...",
    label_voice: "Voix du Coach",
    voice_male: "Voix Homme",
    voice_female: "Voix Femme",
    label_lang_title: "Langue de Motivation",
    label_state_prompt: "À quel défi fais-tu face en ce moment ?",
    label_custom_context: "Contexte personnel (Facultatif)",
    context_badge: "Défis spécifiques",
    placeholder_custom_context: "Décris brièvement la situation, l'obstacle ou l'objectif précis auquel tu fais face actuellement...",
    btn_motivate: "MOTIVE-MOI",
    under_btn: "Prépare-toi à un regain d'adrénaline. Ressens l'impact d'une motivation brute et implacable.",
    result_title: "La Parole de Cephboy",
    loading_title: "LA FORGE EST EN ACTION",
    loading_quote: "Dans le silence de l'abîme réside la plus pure forme de ta lumière. Ne crains pas les larmes, elles nettoient ton regard.",
    ready_title: "Ton coach est prêt",
    ready_desc: "Saisis ton prénom, sélectionne ton défi ou décris ton objectif, puis clique sur Motive-Moi pour générer ton boost mental.",
    btn_instant_motivation: "Motivation instantanée",
    speech_gender_male: "HOMME",
    speech_gender_female: "FEMME",
    speech_loading_audio: "VOIX EN COURS DE FORGE...",
    speech_btn_play: "ÉCOUTER LA VOIX",
    speech_btn_download: "TÉLÉCHARGER",
    speech_btn_save_un: "GRAVER",
    speech_btn_save_ok: "CONSERVÉ",
    speech_btn_copy: "COPIER",
    speech_btn_copied: "COPIÉ !",
    breath_tip: "Prends de grandes inspirations lentes.",
    btn_new_speech: "Nouveau discours de motivation",
    footer_copyright: "Cephboy AI Coach © 2026 • L'Artiste Éveilleur",
    footer_desc: "Chaque parole est forgée à la commande pour redonner force et fierté. Les émotions fortes et les larmes libérées sont des réactions spirituelles attendues.",
    footer_summit: "Vers le sommet ▲",
    alert_error: "Une ombre passagère a perturbé la connexion avec Cephboy. Veuillez retenter.",
    
    // States
    state_exhausted_lbl: "Physiquement et mentalement épuisé",
    state_exhausted_desc: "Pour surmonter un coup de mou ou un fardeau mental extrême.",
    state_discouraged_lbl: "Démotivé et invisible",
    state_discouraged_desc: "Pour relancer la machine quand tes efforts passent inaperçus.",
    state_crossroads_lbl: "Devant un choix crucial",
    state_crossroads_desc: "Pour dissiper le doute, vaincre la peur de l'inconnu et passer à l'action.",
    state_broken_lbl: "K.O. par un échec",
    state_broken_desc: "Pour transformer tes cicatrices en force et te reconstruire de manière implacable.",
    state_guerre_lbl: "Prêt pour le défi de ta vie",
    state_guerre_desc: "Pour doper ton adrénaline avant un examen, une compétition ou une épreuve importante.",

    // Loading steps
    loading_step_0: "Cephboy écoute ton souffle et tes fardeaux...",
    loading_step_1: "Étouffement des bruits du monde extérieur...",
    loading_step_2: "Forger la parole herculéenne dans l'âtre de la douleur...",
    loading_step_3: "Libération de la force innomée... tiens-toi prêt à renaître."
  },
  Spanish: {
    tagline: "El Maestro del Despertar Emocional v1.1.0",
    ambiance_on: "AMBIENTE CINEMATOGRÁFICO ACTIVO",
    ambiance_off: "ACTIVAR AMBIENTE REVOLUCIONARIO",
    tab_coach: "El Altar del Entrenador",
    tab_journal: "Diario",
    banner_badge: "UN DIÁLOGO DIRECTO ENTRE DOS ALMAS INTENSAS",
    banner_title_1: "ATRÉVETE A APOYAR LA RODILLA,",
    banner_title_2: "PERO NUNCA TE RINDAS.",
    banner_desc: "Cephboy AI Coach no es un asesor común. Él se enfoca en tus dudas reales, te brinda la disciplina mental necesaria y te impulsa a actuar de inmediato con la fuerza bruta de un discurso de película.",
    synth_tip_title: "Consejo de inmersión:",
    synth_tip_desc: "Activa el Ambiente de Sonido arriba a la derecha antes de iniciar la motivación para una experiencia digna de las mejores películas.",
    journal_title: "DIARIO DE PRUEBAS Y VICTORIAS",
    journal_desc: "Encuentra aquí los discursos destacados y las palabras potentes registradas a lo largo de tu camino.",
    journal_count: "guardado",
    journal_count_plural: "guardados",
    journal_empty_title: "El pergamino está vacío",
    journal_empty_desc: "Una vez que el Entrenador te motive con su potente voz, podrás inmortalizar sus palabras con el botón de guardar.",
    btn_request_motivation: "Solicitar Motivación",
    saved_caption_for: "Palabra para",
    read_sermon: "Releer el Sermón",
    delete: "Eliminar",
    configure_trial: "Configurar la Prueba",
    label_name: "¿Cuál es tu nombre?",
    placeholder_name: "Ej: Sebastián, Valeria, Campeón...",
    label_voice: "Voz del Entrenador",
    voice_male: "Voz Masculina",
    voice_female: "Voz Femenina",
    label_lang_title: "Idioma de Motivación",
    label_state_prompt: "¿A qué desafío te enfrentas ahora mismo?",
    label_custom_context: "Contexto personal (Opcional)",
    context_badge: "Desafíos específicos",
    placeholder_custom_context: "Describe brevemente la situación, el obstáculo o el objetivo preciso que enfrentas actualmente...",
    btn_motivate: "MOTÍVAME",
    under_btn: "Prepárate para un subidón de adrenalina. Siente el impacto de una motivación pura e implacable.",
    result_title: "La Palabra de Cephboy",
    loading_title: "LA FORJA ESTÁ EN ACCIÓN",
    loading_quote: "En el silencio del abismo reside la forma más pura de tu luz. No temas a las lágrimas, limpian tu mirada.",
    ready_title: "Tu entrenador está listo",
    ready_desc: "Escribe tu nombre, selecciona tu desafío o describe tu objetivo, luego haz clic en Motívame para generar tu impulso mental.",
    btn_instant_motivation: "Motivación instantánea",
    speech_gender_male: "HOMBRE",
    speech_gender_female: "MUJER",
    speech_loading_audio: "FORJANDO VOZ...",
    speech_btn_play: "ESCUCHAR VOZ",
    speech_btn_download: "DESCARGAR",
    speech_btn_save_un: "GRABAR",
    speech_btn_save_ok: "GUARDADO",
    speech_btn_copy: "COPIAR",
    speech_btn_copied: "¡COPIADO!",
    breath_tip: "Toma respiraciones profundas y lentas.",
    btn_new_speech: "Nuevo discurso de motivación",
    footer_copyright: "Cephboy AI Coach © 2026 • El Artista Despertador",
    footer_desc: "Cada palabra es forjada a pedido para restaurar la fuerza y el orgullo. Las emociones fuertes y las lágrimas liberadas son reacciones espirituales esperadas.",
    footer_summit: "Hacia la cima ▲",
    alert_error: "Una sombra pasajera ha interrumpido la conexión con Cephboy. Por favor, inténtalo de nuevo.",
    
    // States
    state_exhausted_lbl: "Física y mentalmente agotado",
    state_exhausted_desc: "Para superar una racha difícil o una carga mental extrema.",
    state_discouraged_lbl: "Desmotivado e invisible",
    state_discouraged_desc: "Para reiniciar el motor cuando tus esfuerzos pasan desapercibidos.",
    state_crossroads_lbl: "Ante una decisión crucial",
    state_crossroads_desc: "Para disipar dudas, vencer el miedo a lo desconocido y actuar.",
    state_broken_lbl: "K.O. por un fracaso",
    state_broken_desc: "Para transformar tus cicatrices en fuerza y reconstruirte implacablemente.",
    state_guerre_lbl: "Listo para el desafío de tu vida",
    state_guerre_desc: "Para disparar tu adrenalina antes de un examen, competición o prueba importante.",

    // Loading steps
    loading_step_0: "Cephboy escucha tus respiraciones y cargas...",
    loading_step_1: "Mitigando el ruido del mundo exterior...",
    loading_step_2: "Forjando la palabra hercúlea en el fuego del dolor...",
    loading_step_3: "Liberando la fuerza innombrable... prepárate para renacer."
  },
  German: {
    tagline: "Der Meister des emotionalen Erwachens v1.1.0",
    ambiance_on: "KINO-AMBIENTE AKTIV",
    ambiance_off: "SOUND-AMBIENTE AKTIVIEREN",
    tab_coach: "Der Altar des Coaches",
    tab_journal: "Tagebuch",
    banner_badge: "EIN DIREKTER DIALOG ZWISCHEN ZWISCHEN ZWEI INTENSIVEN SEELEN",
    banner_title_1: "WAGE ES, DAS KNIE ZU BEUGEN,",
    banner_title_2: "ABER GIB NIEMALS AUF.",
    banner_desc: "Cephboy AI Coach ist kein gewöhnlicher Berater. Er zielt auf deine echten Zweifel ab, bringt dir die nötige mentale Härte und treibt dich an, mit der rohen Kraft einer Kinorede sofort zu handeln.",
    synth_tip_title: "Eintauchen-Tipp:",
    synth_tip_desc: "Aktiviere oben rechts das Sound-Ambiente, bevor du die Motivation startest, um ein Erlebnis zu genießen, das den größten Filmen würdig ist.",
    journal_title: "TAGEBUCH DER PRÜFUNGEN UND SIEGE",
    journal_desc: "Finde hier die bemerkenswerten Reden und kraftvollen Worte, die auf deinem Weg aufgezeichnet wurden.",
    journal_count: "Eintrag",
    journal_count_plural: "Einträge",
    journal_empty_title: "Die Schriftrolle ist leer",
    journal_empty_desc: "Sobald der Coach dich mit seiner kraftvollen Stimme motiviert hat, kannst du seine Worte durch Klicken auf die Speichertaste verewigen.",
    btn_request_motivation: "Motivation anfordern",
    saved_caption_for: "Worte für",
    read_sermon: "Predigt noch einmal lesen",
    delete: "Löschen",
    configure_trial: "Die Prüfung konfigurieren",
    label_name: "Wie ist dein Vorname?",
    placeholder_name: "Z.B. Sebastian, Valerie, Champion...",
    label_voice: "Stimme des Coaches",
    voice_male: "Männliche Stimme",
    voice_female: "Weibliche Stimme",
    label_lang_title: "Motivations-Sprache",
    label_state_prompt: "Welcher Herausforderung stehst du gerade gegenüber?",
    label_custom_context: "Persönlicher Kontext (Optional)",
    context_badge: "Besondere Probleme",
    placeholder_custom_context: "Beschreibe kurz die Situation, die Hürde oder das genaue Ziel, dem du dich aktuell gegenübersiehst...",
    btn_motivate: "MOTIVIERE MICH",
    under_btn: "Bereite dich auf einen Adrenalinschub vor. Spüre die Wirkung unerbittlicher und roher Motivation.",
    result_title: "Cephboys Worte",
    loading_title: "DIE SCHMIEDE IST AKTIV",
    loading_quote: "Im Schweigen des Abgrunds liegt die reinste Form deines Lichts. Fürchte keine Tränen, sie reinigen deinen Blick.",
    ready_title: "Dein Coach ist bereit",
    ready_desc: "Trage deinen Namen ein, wähle deine Herausforderung oder beschreibe dein Ziel und klicke auf 'Motiviere Mich', um deinen mentalen Schub zu generieren.",
    btn_instant_motivation: "Sofortige Motivation",
    speech_gender_male: "MANN",
    speech_gender_female: "FRAU",
    speech_loading_audio: "STIMME WIRD GESCHMIEDET...",
    speech_btn_play: "STIMME ANHÖREN",
    speech_btn_download: "HERUNTERLADEN",
    speech_btn_save_un: "EINGRABEN",
    speech_btn_save_ok: "GESPEICHERT",
    speech_btn_copy: "KOPIEREN",
    speech_btn_copied: "KOPIERT!",
    breath_tip: "Atme tief und langsam ein.",
    btn_new_speech: "Neue Motivationsrede",
    footer_copyright: "Cephboy AI Coach © 2026 • Der Erweckungskünstler",
    footer_desc: "Jedes Wort wird auf Bestellung geschmiedet, um Stärke und Stolz wiederherzustellen. Starke Emotionen und freigesetzte Tränen sind erwartete spirituelle Reaktionen.",
    footer_summit: "Zum Gipfel ▲",
    alert_error: "Ein vorübergehender Schatten hat die Verbindung zu Cephboy gestört. Bitte versuche es erneut.",
    
    // States
    state_exhausted_lbl: "Körperlich und mental erschöpft",
    state_exhausted_desc: "Um ein Tief oder eine extreme mentale Überlastung zu überwinden.",
    state_discouraged_lbl: "Demotiviert und unsichtbar",
    state_discouraged_desc: "Um den Motor wieder anzuwerfen, wenn deine Bemühungen unbemerkt bleiben.",
    state_crossroads_lbl: "Vor einer entscheidenden Wahl",
    state_crossroads_desc: "Um Zweifel zu zerstreuen, die Angst vor dem Unbekannten zu besiegen und zu handeln.",
    state_broken_lbl: "K.O. durch einen Fehlschlag",
    state_broken_desc: "Um deine Narben in Stärke zu verwandeln und dich unerbittlich neu aufzubauen.",
    state_guerre_lbl: "Bereit für die Herausforderung deines Lebens",
    state_guerre_desc: "Um dein Adrenalin vor einer Prüfung, einem Wettkampf oder einem wichtigen Meilenstein zu steigern.",

    // Loading steps
    loading_step_0: "Cephboy lauscht deinem Atem und deinen Lasten...",
    loading_step_1: "Die Geräusche der Außenwelt verstummen lassen...",
    loading_step_2: "Das herkulische Wort im Feuer des Schmerzes schmieden...",
    loading_step_3: "Freisetzung der namenlosen Kraft... rüste dich für deine Wiedergeburt."
  },
  Italian: {
    tagline: "Il Maestro del Risveglio Emotivo v1.1.0",
    ambiance_on: "AMBIENTE CINEMATOGRAFICO ATTIVO",
    ambiance_off: "ATTIVA AMBIENTE SONORO",
    tab_coach: "L'Altare del Coach",
    tab_journal: "Diario",
    banner_badge: "UN DIALOGO DIRETTO TRA DUE ANIME INTENSE",
    banner_title_1: "OSA APPOGGIARE IL GINOCCHIO,",
    banner_title_2: "MA NON ARRENDERTI MAI.",
    banner_desc: "Cephboy AI Coach non è un consigliere comune. Prende di mira i tuoi veri dubbi, ti fornisce la grinta mentale necessaria e ti spinge ad agire immediatamente con la forza bruta di un discorso cinematografico.",
    synth_tip_title: "Consiglio d'immersione:",
    synth_tip_desc: "Attiva l'ambiente sonoro in alto a destra prima di far partire la motivazione per un'esperienza degna dei migliori film.",
    journal_title: "DIARIO DELLE PROVE E DELLE VITTORIE",
    journal_desc: "Trova qui i discorsi eccezionali e le parole potenti registrati durante il tuo cammino.",
    journal_count: "salvataggio",
    journal_count_plural: "salvataggi",
    journal_empty_title: "La pergamena è vuota",
    journal_empty_desc: "Una volta che il Coach ti avrà motivato con la sua voce potente, potrai immortalare le sue parole cliccando sul pulsante di salvataggio.",
    btn_request_motivation: "Richiedi Motivazione",
    saved_caption_for: "Parole per",
    read_sermon: "Rileggi il Sermone",
    delete: "Elimina",
    configure_trial: "Configura la Prova",
    label_name: "Qual è il tuo nome?",
    placeholder_name: "Es: Sebastiano, Valeria, Campione...",
    label_voice: "Voce del Coach",
    voice_male: "Voce Maschile",
    voice_female: "Voce Femminile",
    label_lang_title: "Lingua della Motivazione",
    label_state_prompt: "Quale sfida stai affrontando in questo momento?",
    label_custom_context: "Contesto personale (Opzionale)",
    context_badge: "Sfide specifiche",
    placeholder_custom_context: "Descrivi brevemente la situazione, l'ostacolo o l'obiettivo preciso che stai affrontando al momento...",
    btn_motivate: "MOTIVAMI",
    under_btn: "Preparati a una scarica di adrenalina. Senti l'impatto di una motivazione pura e implacabile.",
    result_title: "La Parola di Cephboy",
    loading_title: "LA FORGIA È IN AZIONE",
    loading_quote: "Nel silenzio dell'abisso risiede la forma più pura della tua luce. Non temere le lacrime, puliscono il tuo sguardo.",
    ready_title: "Il tuo coach è pronto",
    ready_desc: "Inserisci il tuo nome, seleziona la tua sfida o descrivi il tuo obiettivo, quindi clicca su Motivami per generare la tua spinta mentale.",
    btn_instant_motivation: "Motivazione istantanea",
    speech_gender_male: "UOMO",
    speech_gender_female: "DONNA",
    speech_loading_audio: "FORGIANDO LA VOCE...",
    speech_btn_play: "ASCOLTA LA VOCE",
    speech_btn_download: "SCARICA",
    speech_btn_save_un: "INCIDERE",
    speech_btn_save_ok: "SALVATO",
    speech_btn_copy: "COPIA",
    speech_btn_copied: "COPIATO!",
    breath_tip: "Fai un respiro profondo e lento.",
    btn_new_speech: "Nuovo discorso motivazionale",
    footer_copyright: "Cephboy AI Coach © 2026 • L'Artista del Risveglio",
    footer_desc: "Ogni parola è forgiata su richiesta per ridare forza e orgoglio. Forti emozioni e lacrime liberate sono reazioni spirituali attese.",
    footer_summit: "Verso la vetta ▲",
    alert_error: "Un'ombra passeggera ha interrotto la connessione con Cephboy. Per favore, riprova.",
    
    // States
    state_exhausted_lbl: "Fisicamente e mentalmente esausto",
    state_exhausted_desc: "Per superare un momento di debolezza o un carico mentale estremo.",
    state_discouraged_lbl: "Demotivato e invisibile",
    state_discouraged_desc: "Per riavviare il motore quando i tuoi sforzi passano inosservati.",
    state_crossroads_lbl: "Davanti a una scelta cruciale",
    state_crossroads_desc: "Per dissipare i dubbi, sconfiggere la paura dell'ignoto e agire.",
    state_broken_lbl: "K.O. da un fallimento",
    state_broken_desc: "Per trasformare le tue cicatrici in forza e ricostruirti in modo implacabile.",
    state_guerre_lbl: "Pronto per la sfida della tua vita",
    state_guerre_desc: "Per aumentare l'adrenalina prima di un esame, una gara o una prova importante.",

    // Loading steps
    loading_step_0: "Cephboy ascolta il tuo respiro e i tuoi pesi...",
    loading_step_1: "Silenziando i rumori del mondo esterno...",
    loading_step_2: "Forgiando la parola erculea nel fuoco del dolore...",
    loading_step_3: "Liberazione della forza innominata... preparati a rinascere."
  },
  Portuguese: {
    tagline: "O Mestre do Despertar Emocional v1.1.0",
    ambiance_on: "AMBIENTE CINEMATOGRÁFICO ATIVO",
    ambiance_off: "ATIVAR AMBIENTE SONORO",
    tab_coach: "O Altar do Coach",
    tab_journal: "Diário",
    banner_badge: "UM DIÁLOGO DIRETO ENTRE DUAS ALMAS INTENSAS",
    banner_title_1: "ATREVA-SE A DEITAR O JOELHO,",
    banner_title_2: "MAS NUNCA DESISTA.",
    banner_desc: "Cephboy AI Coach não é um consultor comum. Ele foca nas tuas dúvidas reais, traz a dureza mental necessária e impulsiona-te a agir imediatamente com a força bruta de um discurso de filme.",
    synth_tip_title: "Dica de imersão:",
    synth_tip_desc: "Ative o Ambiente de Som no canto superior direito antes de iniciar a motivação para uma experiência digna dos maiores filmes.",
    journal_title: "DIÁRIO DE PROVAS E VITÓRIAS",
    journal_desc: "Encontre aqui os grandes discursos e palavras impactantes gravados durante o seu percurso.",
    journal_count: "gravação",
    journal_count_plural: "gravações",
    journal_empty_title: "O pergaminho está vazio",
    journal_empty_desc: "Assim que o Treinador te motivar com a sua voz poderosa, poderás imortalizar as suas palavras clicando no botão de gravar.",
    btn_request_motivation: "Solicitar Motivação",
    saved_caption_for: "Palavras para",
    read_sermon: "Reler o Sermon",
    delete: "Excluir",
    configure_trial: "Configurar a Prova",
    label_name: "Qual é o teu primeiro nome?",
    placeholder_name: "Ex: Sebastião, Valéria, Campeão...",
    label_voice: "Voz do Coach",
    voice_male: "Voz Masculina",
    voice_female: "Voz Feminina",
    label_lang_title: "Idioma de Motivação",
    label_state_prompt: "Que desafio estás a enfrentar neste momento?",
    label_custom_context: "Contexto pessoal (Opcional)",
    context_badge: "Desafios específicos",
    placeholder_custom_context: "Descreve brevemente a situação, o obstáculo ou o objetivo preciso que enfrentas atualmente...",
    btn_motivate: "MOTIVA-ME",
    under_btn: "Prepara-te para um pico de adrenalina. Sente o impacto de uma motivação pura e implacável.",
    result_title: "A Palavra de Cephboy",
    loading_title: "A FORJA ESTÁ EM TRABALHO",
    loading_quote: "No silêncio do abismo reside a forma mais pura da tua luz. Não temas as lágrimas, elas limpam o teu olhar.",
    ready_title: "O teu treinador está pronto",
    ready_desc: "Insere o teu nome, seleciona o teu desafio ou descreve o teu objetivo e clica em Motiva-Me para gerar o teu impulso mental.",
    btn_instant_motivation: "Motivação instantânea",
    speech_gender_male: "HOMEM",
    speech_gender_female: "MULHER",
    speech_loading_audio: "FORJANDO A VOZ...",
    speech_btn_play: "OUVIR A VOZ",
    speech_btn_download: "BAIXAR",
    speech_btn_save_un: "GRAVAR",
    speech_btn_save_ok: "GRAVADO",
    speech_btn_copy: "COPIAR",
    speech_btn_copied: "COPIADO!",
    breath_tip: "Dá de uma respiração lenta e profunda.",
    btn_new_speech: "Novo discurso de motivação",
    footer_copyright: "Cephboy AI Coach © 2026 • O Artista do Despertar",
    footer_desc: "Cada palavra é forjada sob encomenda para restaurar força e orgulho. Emoções fortes e lágrimas liberadas são reações espirituais esperadas.",
    footer_summit: "Para o topo ▲",
    alert_error: "Uma sombra passageira perturbou a ligação com o Cephboy. Por favor, tente novamente.",
    
    // States
    state_exhausted_lbl: "Fisicamente e mentalmente exausto",
    state_exhausted_desc: "Para superar uma fase difícil ou uma sobrecarga mental extrema.",
    state_discouraged_lbl: "Desmotivado e invisível",
    state_discouraged_desc: "Para reativar o motor quando os teus esforços passam despercebidos.",
    state_crossroads_lbl: "Diante de uma escolha crucial",
    state_crossroads_desc: "Para dissipar dúvidas, vencer o medo do desconhecido e agir.",
    state_broken_lbl: "K.O. por uma falha",
    state_broken_desc: "Para transformar as tuas cicatrizes em força e te reconstruires implacavelmente.",
    state_guerre_lbl: "Pronto para o desafio da tua vida",
    state_guerre_desc: "Para dar um boost de adrenalina antes de um exame, competição ou prova.",

    // Loading steps
    loading_step_0: "Cephboy ouve a tua respiração e os teus fardos...",
    loading_step_1: "Abafando os ruídos do mundo exterior...",
    loading_step_2: "Forjando a palavra hercúlea na chama da dor...",
    loading_step_3: "Liberação de força inominada... prepara-te para renascer."
  },
  Arabic: {
    tagline: "سيد الصحوة العاطفية v1.1.0",
    ambiance_on: "البيئة السينمائية نشطة",
    ambiance_off: "تفعيل المؤثرات الصوتية",
    tab_coach: "محراب المدرب",
    tab_journal: "السجل",
    banner_badge: "حوار مباشر بين روحين قويتين",
    banner_title_1: "تجرأ على حني الركبة،",
    banner_title_2: "لكن لا تستسلم أبداً.",
    banner_desc: "Cephboy AI Coach ليس مستشاراً عادياً. إنه يستهدف شكوكك الحقيقية، ويمنحك الصلابة الذهنية اللازمة، ويدفعك للعمل فوراً بالقوة الغاشمة لخطاب سينمائي.",
    synth_tip_title: "نصيحة الغمر:",
    synth_tip_desc: "قم بتنشيط المؤثرات الصوتية في أعلى اليمين قبل بدء التحفيز لتجربة تليق بأعظم الأفلام.",
    journal_title: "سجل المحن والانتصارات",
    journal_desc: "ابحث هنا عن الخطب الاستثنائية والكلمات المؤثرة المسجلة خلال مسيرتك.",
    journal_count: "حفظ",
    journal_count_plural: "محفوظات",
    journal_empty_title: "اللفافة فارغة",
    journal_empty_desc: "بمجرد أن يحفزك المدرب بصوته القوي، يمكنك تخليد كلماته بالنقر فوق زر الحفظ.",
    btn_request_motivation: "طلب تحفيز",
    saved_caption_for: "كلمة من أجل",
    read_sermon: "إعادة قراءة الموعظة",
    delete: "حذف",
    configure_trial: "خصائص المحنة",
    label_name: "ما هو اسمك؟",
    placeholder_name: "مثال: سيباستيان، فاليري، بطل...",
    label_voice: "صوت المدرب",
    voice_male: "صوت رجالي",
    voice_female: "صوت نسائي",
    label_lang_title: "لغة التحفيز",
    label_state_prompt: "ما هو التحدي الذي تواجهه الآن؟",
    label_custom_context: "سياق شخصي (اختياري)",
    context_badge: "تحديات محددة",
    placeholder_custom_context: "صِف بإيجاز الموقف، الحاجز، أو الهدف الدقيق الذي تواجهه حالياً...",
    btn_motivate: "حفزني الآن",
    under_btn: "استعد لتدفق الأدرينالين. اشعر بتأثير التحفيز الخام والقوي.",
    result_title: "قول سيفبوي",
    loading_title: "الفرن مشتعل الآن",
    loading_quote: "في صمت الهاوية يكمن أنقى أشكال نورك. لا تخف من الدموع، فهي تنظف نظرتك.",
    ready_title: "مدربك جاهز الآن",
    ready_desc: "أدخل اسمك، واختر التحدي الذي يواجهك أو صف هدفك، ثم انقر على حفزني لإنشاء دفعتك العقلية.",
    btn_instant_motivation: "تحفيز فوري",
    speech_gender_male: "ذكر",
    speech_gender_female: "أنثى",
    speech_loading_audio: "يتم الآن تجميع الصوت...",
    speech_btn_play: "استمع إلى الصوت",
    speech_btn_download: "تنزيل",
    speech_btn_save_un: "حفر",
    speech_btn_save_ok: "محفوظ",
    speech_btn_copy: "نسخ",
    speech_btn_copied: "تم النسخ!",
    breath_tip: "خذ أنفاساً عميقة وبطيئة.",
    btn_new_speech: "خطاب تحفيزي جديد",
    footer_copyright: "Cephboy AI Coach © 2026 • فنان الإيقاظ",
    footer_desc: "كل كلمة تُصاغ عند الطلب لاستعادة القوة والفخر. المشاعر القوية والدموع المحررة هي ردود أفعال روحية متوقعة.",
    footer_summit: "إلى القمة ▲",
    alert_error: "عطل طارئ قطع الاتصال مع سيفبوي. يرجى المحاولة مرة أخرى.",
    
    // States
    state_exhausted_lbl: "منهك جسدياً ونفسياً",
    state_exhausted_desc: "للتغلب على الخمول المفاجئ أو العبء الذهني الزائد.",
    state_discouraged_lbl: "محبط وغير مرئي",
    state_discouraged_desc: "لإعادة تشغيل المحرك عندما تمر جهودك دون أن يلاحظها أحد.",
    state_crossroads_lbl: "أمام اختيار حاسم",
    state_crossroads_desc: "لتبديد الشك وقهر الخوف من المجهول والبدء بالعمل.",
    state_broken_lbl: "متحطم بسبب الفشل",
    state_broken_desc: "لتحويل جروحك إلى قوة وبناء نفسك من جديد بشكل صارم.",
    state_guerre_lbl: "مستعد لتحدي حياتك",
    state_guerre_desc: "لتحفيز الأدرينالين لديك قبل امتحان، مسابقة أو اختبار هام.",

    // Loading steps
    loading_step_0: "سيفبوي يستمع إلى أنفاسك وأعبائك...",
    loading_step_1: "كتم ضوضاء العالم الخارجي...",
    loading_step_2: "صياغة الكلمة الجبارة في فرن الألم...",
    loading_step_3: "تحرير القوة غير المسماة... استعد لتولد من جديد."
  },
  Japanese: {
    tagline: "覚醒をもたらす感情のマスター v1.1.0",
    ambiance_on: "シネマティック音響が有効",
    ambiance_off: "音響演出を有効にする",
    tab_coach: "コーチの祭壇",
    tab_journal: "記録",
    banner_badge: "深く熱い二つの魂の間で交わされる直接の対話",
    banner_title_1: "膝をつくことを恐れるな、",
    banner_title_2: "だが絶対に降伏するな。",
    banner_desc: "Cephboy AI Coachはありきたりのアドバイザーではありません。あなたの心の奥底にある疑問を見抜き、必要な精神力を授け、映画のワンシーンのような力強い演説であなたを即座に行動へと駆り立てます。",
    synth_tip_title: "没入への助言：",
    synth_tip_desc: "映画の最高峰のような没入感を得るために、モチベーションを開始する前に右上の音響演出を有効にしてください。",
    journal_title: "試練と勝利の記録",
    journal_desc: "あなたの旅路で記録された、心に響く素晴らしい演説と金言をここで確認できます。",
    journal_count: "保存",
    journal_count_plural: "保存履歴",
    journal_empty_title: "羊皮紙は空です",
    journal_empty_desc: "コーチの力強い声で心を奮い立たせた後、保存ボタンをクリックして言葉を永遠に刻むことができます。",
    btn_request_motivation: "モチベーションを要求する",
    saved_caption_for: "言葉を授ける：",
    read_sermon: "説教を読み返す",
    delete: "削除",
    configure_trial: "試練の設定",
    label_name: "あなたの名前は何ですか？",
    placeholder_name: "例：セバスチャン、バルリー、チャンピオン...",
    label_voice: "コーチの声",
    voice_male: "男性の声",
    voice_female: "女性の声",
    label_lang_title: "モチベーション言語",
    label_state_prompt: "今、どのような試練に直面していますか？",
    label_custom_context: "個人の背景設定（任意）",
    context_badge: "具体的な課題",
    placeholder_custom_context: "現在直面している状況、障害、または正確な目標を簡単に入力してください...",
    btn_motivate: "奮い立たせる",
    under_btn: "アドレナリンが湧き上がるのを感じてください。容赦のない、生のモチベーションの衝撃を体感。 ",
    result_title: "Cephboyの啓示",
    loading_title: "魂の鍛冶場が稼働中",
    loading_quote: "深淵の沈黙の中にこそ、あなたの光 of the purest form が存在します。涙を恐れるな、それは瞳を浄化するものだ。",
    ready_title: "コーチの準備ができました",
    ready_desc: "名前を入力し、直面している課題を選択、または目標を記述して「奮い立たせる」をクリックし、精神力をチャージしてください。",
    btn_instant_motivation: "即座のモチベーション",
    speech_subhead: "モチベーション演説",
    speech_head: "シネマティック・モチベーション",
    speech_gender_male: "男性",
    speech_gender_female: "女性",
    speech_loading_audio: "音声を鍛造中...",
    speech_btn_play: "声を聴く",
    speech_btn_download: "ダウンロード",
    speech_btn_save_un: "刻む",
    speech_btn_save_ok: "刻まれた言葉",
    speech_btn_copy: "コピー",
    speech_btn_copied: "コピー完了！",
    breath_tip: "大きくゆっくりと息を吸い込んでください。",
    btn_new_speech: "新しいモチベーション演説",
    footer_copyright: "Cephboy AI Coach © 2026 • 覚醒のアーティスト",
    footer_desc: "強さと誇りを取り戻すために、すべての言葉があなたのためだけに鍛造されます。湧き上がる感情と涙は、精神的な解放 of expected spiritual reactions です。",
    footer_summit: "頂点へ ▲",
    alert_error: "一時的な影がCephboyとの接続を遮断しました。もう一度お試しください。",
    
    // States
    state_exhausted_lbl: "肉体的・精神的な極限の疲労",
    state_exhausted_desc: "無気力感や極度の精神的重圧を乗り越えるために。",
    state_discouraged_lbl: "モチベーションの喪失と孤独",
    state_discouraged_desc: "努力が誰からも気づかれないとき、再び内なるエンジンを起動させるために。",
    state_crossroads_lbl: "重大な決断の岐路",
    state_crossroads_desc: "疑念を晴らし、未知への恐怖を克服し、行動を起こすために。",
    state_broken_lbl: "敗北による挫折",
    state_broken_desc: "傷跡を力へと変え、容赦なく自分自身を再構築するために。",
    state_guerre_lbl: "人生最大の試練を控えている",
    state_guerre_desc: "試験、大会、または重要な岐路を控えてアドレナリンを高めるために。",

    // Loading steps
    loading_step_0: "Cephboyはあなたの呼吸と重荷に耳を傾けています...",
    loading_step_1: "外界の雑音を遮断しています...",
    loading_step_2: "苦痛の鍛冶場で、力強い言葉を刻み込んでいます...",
    loading_step_3: "名もなき力を解き放っています... 再生への準備を整えてください。"
  }
};

export default function App() {
  // Input states
  const [userName, setUserName] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("exhausted");
  const [customContext, setCustomContext] = useState<string>("");
  const [voiceGender, setVoiceGender] = useState<"male" | "female">(() => {
    const saved = localStorage.getItem("cephboy_voice_gender");
    return (saved === "male" || saved === "female") ? saved : "male";
  });
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    const saved = localStorage.getItem("cephboy_language");
    return saved || "English";
  });
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);

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
  const shouldAutoPlayNextVoice = useRef<boolean>(false);

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
      }, 1000);
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

  // Charge ou régénère la voix du Coach de manière réactive à chaque changement de genre ou de phrase de victoire
  useEffect(() => {
    if (!victorySentence || !showResult) {
      return;
    }

    // Stop current voice playback first to prevent overlap on voice change
    stopVoice();
    setCurrentAudioBase64(null);
    setIsVoiceLoading(true);

    const controller = new AbortController();
    fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: victorySentence, voiceGender: voiceGender, language: selectedLanguage }),
      signal: controller.signal
    })
    .then((res) => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then((data) => {
      if (data.audioBase64) {
        setCurrentAudioBase64(data.audioBase64);
        
        // Auto-play only if first triggered by generating a fresh motivation
        if (shouldAutoPlayNextVoice.current) {
          shouldAutoPlayNextVoice.current = false;
          setTimeout(() => {
            triggerVoicePlayback(data.audioBase64, "sentence");
          }, 400);
        }
      }
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        console.error("Vocal synthesis failed:", err);
      }
    })
    .finally(() => {
      setIsVoiceLoading(false);
    });

    return () => {
      controller.abort();
    };
  }, [victorySentence, voiceGender, selectedLanguage, showResult]);

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
      
      // Request active auto-playback once the new voice loads
      shouldAutoPlayNextVoice.current = true;

      const response = await fetch("/api/motivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: userName || "Champion",
          userState: stateLabel,
          customContext: customContext,
          voiceGender: voiceGender,
          language: selectedLanguage
        })
      });

      if (!response.ok) {
        throw new Error("La connexion avec le coach AI a échoué.");
      }

      const data = await response.json();
      setMotivationText(data.text);
      setVictorySentence(data.victorySentence);
      setCurrentAudioBase64(null); // Clear previous voice audio to trigger loader
      setShowResult(true);

      // Scroll into view instantly so they can read the text immediately
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);

    } catch (err) {
      console.error(err);
      shouldAutoPlayNextVoice.current = false;
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
        body: JSON.stringify({ text: textToSpeak, voiceGender: voiceGender, language: selectedLanguage })
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
      victorySentence: victorySentence,
      voiceGender: voiceGender,
      language: selectedLanguage
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
    
    // Switch to the gender this item was saved with if present, to preserve integrity
    if (item.voiceGender) {
      setVoiceGender(item.voiceGender);
      localStorage.setItem("cephboy_voice_gender", item.voiceGender);
    }

    // Switch to the language this item was saved with if present, to preserve integrity
    if (item.language) {
      setSelectedLanguage(item.language);
      localStorage.setItem("cephboy_language", item.language);
    }
    
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
    UI_TEXTS[selectedLanguage]?.["loading_step_0"] || "Cephboy listens to your breath and your burdens...",
    UI_TEXTS[selectedLanguage]?.["loading_step_1"] || "Shedding the noise of the outside world...",
    UI_TEXTS[selectedLanguage]?.["loading_step_2"] || "Forging herculean words in the hearth of pain...",
    UI_TEXTS[selectedLanguage]?.["loading_step_3"] || "Releasing the unnamed force... ready yourself to be reborn."
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
                <TrendingUp className="w-3 h-3 text-amber-500" /> {UI_TEXTS[selectedLanguage]?.["tagline"] || "Le Maître de l'Éveil Émotionnel v1.1.0"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap relative">
            {/* Global Language Selector Dropdown */}
            <div className="relative">
              <button
                id="header_lang_button"
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-xs border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:border-slate-700 transition duration-300 outline-none select-none"
              >
                <Globe className="w-3.5 h-3.5 text-amber-550 animate-pulse" />
                <span className="text-xs">
                  {(LANGUAGES.find(l => l.code === selectedLanguage) || LANGUAGES[0]).flag}
                </span>
                <span className="uppercase font-bold text-[10px] tracking-wider inline-block">
                  {(LANGUAGES.find(l => l.code === selectedLanguage) || LANGUAGES[0]).label}
                </span>
                <span className="text-slate-500 text-[8px] ml-0.5">▼</span>
              </button>
              
              {isLangDropdownOpen && (
                <>
                  {/* Backdrop overlay to close when clicking outside */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsLangDropdownOpen(false)}
                  ></div>
                  
                  {/* Dropdown Menu Container */}
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-slate-950 border border-slate-800 p-2 shadow-2xl z-50 animate-fadeIn">
                    <p className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-widest text-slate-500 border-b border-slate-900 mb-1.5">
                      {selectedLanguage === "French" ? "Langue" : "Language"}
                    </p>
                    <div className="max-h-60 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                      {LANGUAGES.map((lang) => {
                        const isSelected = selectedLanguage === lang.code;
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => {
                              setSelectedLanguage(lang.code);
                              localStorage.setItem("cephboy_language", lang.code);
                              setIsLangDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition duration-200 font-sans outline-none ${
                              isSelected
                                ? "bg-amber-500/10 text-amber-300 font-semibold"
                                : "text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span>{lang.flag}</span>
                              <span>{lang.label}</span>
                            </span>
                            {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

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
                  <span>{UI_TEXTS[selectedLanguage]?.["ambiance_on"] || "AMBIANCE CINÉMATIQUE ACTIVÉE"}</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>{UI_TEXTS[selectedLanguage]?.["ambiance_off"] || "ACTIVER L'AMBIANCE SONORE"}</span>
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
                {UI_TEXTS[selectedLanguage]?.["tab_coach"] || "L'Autel du Coach"}
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
                <span>{UI_TEXTS[selectedLanguage]?.["tab_journal"] || "Journal"} ({savedMotivations.length})</span>
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
            <span>{UI_TEXTS[selectedLanguage]?.["banner_badge"] || "UN DIALOGUE DIRECT ENTRE DEUX ÂMES INTENSES"}</span>
          </div>
          
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-wider text-slate-100 leading-tight">
            {UI_TEXTS[selectedLanguage]?.["banner_title_1"] || "DARE TO REST YOUR KNEE,"}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
              {UI_TEXTS[selectedLanguage]?.["banner_title_2"] || "BUT NEVER SURRENDER."}
            </span>
          </h2>
          
           <p className="text-slate-400 text-sm max-w-lg mx-auto font-sans leading-relaxed">
            {UI_TEXTS[selectedLanguage]?.["banner_desc"] || "Cephboy AI Coach n'est pas un conseiller ordinaire. Il cible tes doutes réels, t'apporte la rigueur mentale nécessaire et te pousse à agir immédiatement avec la force d'un discours de cinéma."}
          </p>

          {showSynthTip && (
            <div className="p-3 bg-amber-500/5 max-w-md mx-auto rounded-xl border border-amber-500/10 text-xs text-amber-300 flex items-center justify-center gap-3">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <p>
                <strong>{UI_TEXTS[selectedLanguage]?.["synth_tip_title"] || "Conseil d'immersion :"}</strong> {UI_TEXTS[selectedLanguage]?.["synth_tip_desc"] || "Active l'Ambiance Sonore en haut à droite avant de lancer la motivation pour une immersion digne des plus grands films."}
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
                    {UI_TEXTS[selectedLanguage]?.["journal_title"] || "JOURNAL OF TRIALS AND VICTORIES"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {UI_TEXTS[selectedLanguage]?.["journal_desc"] || "Find here the outstanding speeches and powerful quotes recorded during your journey."}
                  </p>
                </div>
                <div role="status" className="font-mono text-xs text-slate-500">
                  {savedMotivations.length} {savedMotivations.length > 1 ? (UI_TEXTS[selectedLanguage]?.["journal_count_plural"] || "savings") : (UI_TEXTS[selectedLanguage]?.["journal_count"] || "saving")}
                </div>
              </div>

              {savedMotivations.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/40 border border-slate-900 rounded-2xl space-y-4 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-full bg-slate-850 mx-auto flex items-center justify-center text-slate-500">
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-slate-300 font-medium">{UI_TEXTS[selectedLanguage]?.["journal_empty_title"] || "The scroll is empty"}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {UI_TEXTS[selectedLanguage]?.["journal_empty_desc"] || "Once the Coach has motivated you with his powerful voice, you can immortalize his words by clicking the save button."}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("coach")}
                    className="px-4 py-2 bg-slate-800 text-xs font-semibold text-amber-400 rounded-lg border border-slate-700 hover:bg-slate-750 transition"
                  >
                    {UI_TEXTS[selectedLanguage]?.["btn_request_motivation"] || "Request Motivation"}
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
                          {UI_TEXTS[selectedLanguage]?.["saved_caption_for"] || "Speech for"} {item.name}
                        </h4>

                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed font-sans italic">
                          " {item.text} "
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-950 pt-3 mt-4">
                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                          <Quote className="w-3 h-3 text-amber-500" /> {UI_TEXTS[selectedLanguage]?.["read_sermon"] || "Re-read the Sermon"}
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
                            {UI_TEXTS[selectedLanguage]?.["delete"] || "Delete"}
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
                  <Sliders className="w-5 h-5 text-amber-500" /> {UI_TEXTS[selectedLanguage]?.["configure_trial"] || "Configure the Trial"}
                </h3>

                <form onSubmit={handleMotivateMe} className="space-y-6 bg-slate-900/30 p-6 rounded-2xl border border-slate-900">
                  
                  {/* Name field */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-amber-500" />
                      <span>{UI_TEXTS[selectedLanguage]?.["label_name"] || "What is your name?"}</span>
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder={UI_TEXTS[selectedLanguage]?.["placeholder_name"] || "e.g. Sebastian, Valerie, Champion..."}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500/40 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition font-sans shadow-inner focus:ring-1 focus:ring-amber-500/20"
                    />
                  </div>

                  {/* Voice Gender Selection */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                      <span>{UI_TEXTS[selectedLanguage]?.["label_voice"] || "Coach's Voice"}</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setVoiceGender("male");
                          localStorage.setItem("cephboy_voice_gender", "male");
                        }}
                        className={`py-2.5 px-4 rounded-xl border text-center font-sans font-medium text-xs transition-all duration-300 flex items-center justify-center gap-2 outline-none ${
                          voiceGender === "male"
                            ? "bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-inner"
                            : "bg-slate-950/80 border-slate-800 hover:bg-slate-900/40 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <User className="w-3.5 h-3.5 text-amber-500" />
                        <span>{UI_TEXTS[selectedLanguage]?.["voice_male"] || "Male Voice"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVoiceGender("female");
                          localStorage.setItem("cephboy_voice_gender", "female");
                        }}
                        className={`py-2.5 px-4 rounded-xl border text-center font-sans font-medium text-xs transition-all duration-300 flex items-center justify-center gap-2 outline-none ${
                          voiceGender === "female"
                            ? "bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-inner"
                            : "bg-slate-950/80 border-slate-800 hover:bg-slate-900/40 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <User className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{UI_TEXTS[selectedLanguage]?.["voice_female"] || "Female Voice"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Language Selection */}
                  <div className="space-y-3">
                    <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{UI_TEXTS[selectedLanguage]?.["label_lang_title"] || "Motivation Language"}</span>
                    </label>
                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2">
                      {LANGUAGES.map((lang) => {
                        const isSel = selectedLanguage === lang.code;
                        return (
                          <button
                            type="button"
                            key={lang.code}
                            onClick={() => {
                              setSelectedLanguage(lang.code);
                              localStorage.setItem("cephboy_language", lang.code);
                            }}
                            className={`py-2 px-1 rounded-xl border text-center transition-all duration-300 flex flex-col items-center justify-center gap-1 outline-none active:scale-95 ${
                              isSel
                                ? "bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-inner scale-[1.02]"
                                : "bg-slate-950/80 border-slate-800 hover:bg-slate-900/40 text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            <span className="text-base select-none">{lang.flag}</span>
                            <span className="text-[10px] font-medium font-sans truncate w-full text-center">{lang.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Soul State Presets */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
                      {UI_TEXTS[selectedLanguage]?.["label_state_prompt"] || "What challenge are you facing right now?"}
                    </label>
                    
                    <div className="space-y-2">
                      {PRESET_STATES.map((state) => {
                        const IconComponent = state.icon;
                        const isSelected = selectedState === state.id;
                        const displayLabel = UI_TEXTS[selectedLanguage]?.[`state_${state.id}_lbl`] || state.label;
                        const displayDesc = UI_TEXTS[selectedLanguage]?.[`state_${state.id}_desc`] || state.description;
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
                                {displayLabel}
                              </h4>
                              <p className="text-[11px] text-slate-500 group-hover:text-slate-400 mt-0.5 leading-relaxed font-sans">
                                {displayDesc}
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
                        <span>{UI_TEXTS[selectedLanguage]?.["label_custom_context"] || "Personal Context (Optional)"}</span>
                      </label>
                      <span className="text-[10px] text-slate-600">{UI_TEXTS[selectedLanguage]?.["context_badge"] || "Specific challenges"}</span>
                    </div>
                    
                    <textarea
                      value={customContext}
                      onChange={(e) => setCustomContext(e.target.value)}
                      placeholder={UI_TEXTS[selectedLanguage]?.["placeholder_custom_context"] || "Briefly describe the situation, obstacle, or precise goal you are currently facing..."}
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
                          {UI_TEXTS[selectedLanguage]?.["btn_motivate"] || "MOTIVATE ME"}
                        </span>
                      </div>
                    </button>
                    
                    <p className="text-[10px] text-slate-600 text-center font-mono mt-3">
                      {UI_TEXTS[selectedLanguage]?.["under_btn"] || "Get ready for a rush of adrenaline. Feel the impact of raw and relentless motivation."}
                    </p>
                  </div>

                </form>

              </div>

              {/* Right Column / Results & Interaction Panel */}
              <div className="lg:col-span-7 space-y-6">
                
                <h3 className="font-display text-xl font-semibold text-amber-400 tracking-wider border-b border-slate-900 pb-3 h-9 flex items-center gap-2 animate-fadeIn">
                  <Quote className="w-5 h-5 text-amber-500 animate-pulse" /> {UI_TEXTS[selectedLanguage]?.["result_title"] || "La Parole de Cephboy"}
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
                        {UI_TEXTS[selectedLanguage]?.["loading_title"] || "LA FORGE EST EN ACTION"}
                      </h4>
                      
                      <div className="h-6 overflow-hidden relative">
                        <p className="text-[13px] text-amber-400 font-mono tracking-wider transition-all duration-500">
                          {LOADING_MESSAGES[loadingStep]}
                        </p>
                      </div>

                      <div className="w-48 bg-slate-950 h-1 rounded-full overflow-hidden mx-auto border border-slate-850">
                        <div 
                          className="bg-gradient-to-r from-amber-600 to-amber-300 h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${(loadingStep + 1) * 25}%` }}
                        ></div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 italic max-w-xs leading-relaxed">
                      "{UI_TEXTS[selectedLanguage]?.["loading_quote"] || "Dans le silence de l'abîme réside la plus pure forme de ta lumière. Ne crains pas les larmes, elles nettoient ton regard."}"
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
                        {UI_TEXTS[selectedLanguage]?.["ready_title"] || "Ton coach est prêt"}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-sans">
                        {UI_TEXTS[selectedLanguage]?.["ready_desc"] || "Saisis ton prénom, sélectionne ton défi ou décris ton objectif, puis clique sur Motive-Moi pour générer ton boost mental."}
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => handleMotivateMe()}
                        className="py-2 px-5 rounded-lg bg-slate-900 hover:bg-slate-850 hover:text-amber-400 transition text-[11px] font-mono border border-slate-850 flex items-center gap-2 text-slate-400"
                      >
                        <span>{UI_TEXTS[selectedLanguage]?.["btn_instant_motivation"] || "Motivation instantanée"}</span>
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
                            <span className="font-mono text-[9px] text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                              <span>DISCOURS DE MOTIVATION</span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 text-[8px] flex items-center gap-1">
                                <span>{(LANGUAGES.find(l => l.code === selectedLanguage) || LANGUAGES[0]).flag}</span>
                                <span>{(LANGUAGES.find(l => l.code === selectedLanguage) || LANGUAGES[0]).label.toUpperCase()}</span>
                              </span>
                            </span>
                            <h4 className="font-display text-sm font-semibold text-slate-200">
                              Motivation Cinématique
                            </h4>
                          </div>
                        </div>

                        {/* Top controls: Stop / Save / Close */}
                        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                          
                          {/* Sélecteur de voix direct sur la carte */}
                          <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 p-1 rounded-xl">
                            <button
                              onClick={() => {
                                setVoiceGender("male");
                                localStorage.setItem("cephboy_voice_gender", "male");
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all duration-300 flex items-center gap-1.5 outline-none ${
                                voiceGender === "male"
                                  ? "bg-amber-500/10 border border-amber-500/30 text-amber-300 shadow-inner"
                                  : "text-slate-500 hover:text-slate-300 border border-transparent"
                              }`}
                              title="Voix Homme"
                            >
                              <User className="w-3 h-3 text-amber-500" />
                              <span>HOMME</span>
                            </button>
                            <button
                              onClick={() => {
                                setVoiceGender("female");
                                localStorage.setItem("cephboy_voice_gender", "female");
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all duration-300 flex items-center gap-1.5 outline-none ${
                                voiceGender === "female"
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-inner"
                                  : "text-slate-500 hover:text-slate-300 border border-transparent"
                              }`}
                              title="Voix Femme"
                            >
                              <User className="w-3 h-3 text-emerald-500" />
                              <span>FEMME</span>
                            </button>
                          </div>

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
              {UI_TEXTS[selectedLanguage]?.["footer_copyright"] || "Cephboy AI Coach © 2026 • The Awakening Artist"}
            </p>
            <p className="text-[11px] text-slate-600">
              {UI_TEXTS[selectedLanguage]?.["footer_desc"] || "Every word is forged to order to restore strength and pride. Strong emotions and released tears are expected spiritual reactions."}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <a 
              href="#cephboy_app_root" 
              className="font-mono text-[10.5px] text-slate-500 hover:text-slate-300 transition uppercase tracking-wider"
            >
              {UI_TEXTS[selectedLanguage]?.["footer_summit"] || "To the summit ▲"}
            </a>
          </div>

        </div>
      </footer>

    </div>
  );
}
