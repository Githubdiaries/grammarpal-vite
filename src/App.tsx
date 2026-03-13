/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Trophy, 
  Play, 
  LogOut, 
  ChevronRight,
  ArrowRight,
  GraduationCap,
  Sparkles,
  ChevronLeft,
  CheckCircle2,
  Circle,
  Award,
  Volume2,
  Lock,
  Loader2,
  Crown,
  Star
} from 'lucide-react';
import { useStore } from './store';
import confetti from 'canvas-confetti';
import { GoogleGenAI } from "@google/genai";

// --- Asset Generation ---

const useAssets = () => {
  const [assets, setAssets] = useState<{
    bg: string | null;
    eevee: string | null;
    snorlax: string | null;
    ash: string | null;
  }>({
    bg: null,
    eevee: null,
    snorlax: null,
    ash: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const generateWithRetry = async (params: any, retries = 3, delay = 2000): Promise<any> => {
        try {
          return await ai.models.generateContent(params);
        } catch (err: any) {
          const errMsg = err.message || "";
          if (errMsg.includes("429") || err.status === 429 || errMsg.includes("RESOURCE_EXHAUSTED")) {
            if (retries > 0) {
              console.log(`Rate limited. Retrying in ${delay}ms... (${retries} retries left)`);
              await new Promise(resolve => setTimeout(resolve, delay));
              return generateWithRetry(params, retries - 1, delay * 2);
            }
          }
          throw err;
        }
      };

      // Sequential generation to avoid hitting concurrent request limits
      const bgRes = await generateWithRetry({
        model: "gemini-2.5-flash-image",
        contents: [{
          text: "A professional, ultra-high-resolution 3-layer parallax game environment for a 2D-platformer. Background: Cinematic snow-capped Japanese mountains and a winding river at sunrise. Midground: A steaming turquoise hot spring pool with high-detail rock textures. Foreground: A dark-stained cedar wood balcony with a light-oak bench, presented in a slight isometric 3D perspective to show depth. Style: Professional high-fidelity anime concept art, Studio Ghibli inspired, volumetric lighting, serene atmosphere, 16:9 ratio. ZERO TEXT."
        }],
        config: { imageConfig: { aspectRatio: "16:9" } }
      });

      // Small pause between requests
      await new Promise(resolve => setTimeout(resolve, 1000));

      const eeveeRes = await generateWithRetry({
        model: "gemini-2.5-flash-image",
        contents: [{
          text: "A high-resolution, full-body digital painting of Eevee, rendered in a Studio Ghibli-inspired art style. Eevee is standing, facing forward with a bright, engaged expression. The model has clean outlines and detailed fur texture. Plain white background."
        }],
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const snorlaxRes = await generateWithRetry({
        model: "gemini-2.5-flash-image",
        contents: [{
          text: "A high-resolution, full-body digital painting of Snorlax, rendered in a Studio Ghibli-inspired art style. Snorlax is wide, massive, and happy. Plain white background."
        }],
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const ashRes = await generateWithRetry({
        model: "gemini-2.5-flash-image",
        contents: [{
          text: "A high-resolution head-and-shoulders portrait of Ash Ketchum in a Studio Ghibli-inspired art style, with a reassuring, expert expression, set on a plain white background."
        }],
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      const extract = (res: any) => {
        if (!res?.candidates?.[0]?.content?.parts) return null;
        for (const part of res.candidates[0].content.parts) {
          if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
        return null;
      };

      setAssets({
        bg: extract(bgRes),
        eevee: extract(eeveeRes),
        snorlax: extract(snorlaxRes),
        ash: extract(ashRes)
      });
    } catch (err: any) {
      console.error("Asset generation failed:", err);
      setError(err.message || "Failed to generate assets. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return { assets, loading, error, generate };
};

// --- Types & Mock Data ---

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
  type?: 'multiple-choice' | 'true-false' | 'fill-in-blank' | 'match';
  pairs?: { left: string; right: string }[];
}

interface LessonContentData {
  title: string;
  description: string;
  image: string;
  body: string;
  examples: string[];
  videos: { title: string; id: string }[];
}

const LESSON_CONTENT: Record<string, LessonContentData> = {
  nouns: {
    title: "Nouns",
    description: "The Naming Words",
    image: "https://picsum.photos/seed/nouns/800/450",
    body: "A noun is a word that names a person, place, thing, or idea. Everything you see around you has a name, and that name is a noun! Without nouns, we wouldn't know what to call anything.",
    examples: ["Pikachu (Person)", "School (Place)", "Pokéball (Thing)", "Happiness (Idea)"],
    videos: [
      { title: "What is a Noun?", id: "8W_q699p690" },
      { title: "Noun Song for Kids", id: "qcXy6_Mqe54" },
      { title: "Common and Proper Nouns", id: "L9W5aR6p690" }
    ]
  },
  verbs: {
    title: "Verbs",
    description: "The Action Words",
    image: "https://picsum.photos/seed/verbs/800/450",
    body: "Verbs are words that describe actions. They tell us what the subject of a sentence is doing. Every sentence needs at least one verb to make sense!",
    examples: ["Run", "Jump", "Think", "Speak"],
    videos: [
      { title: "Action Verbs", id: "ineCCpqpZrM" },
      { title: "The Verb Song", id: "j3S3S3S3S3S" },
      { title: "Helping Verbs", id: "W7W7W7W7W7W" }
    ]
  },
  tenses: {
    title: "Tenses",
    description: "The Time Travelers",
    image: "https://picsum.photos/seed/tenses/800/450",
    body: "Tenses tell us when an action happens. We use the Past Tense for things that already happened, the Present Tense for things happening now, and the Future Tense for things that will happen later.",
    examples: ["I walked (Past)", "I walk (Present)", "I will walk (Future)"],
    videos: [
      { title: "Past, Present, Future", id: "9W9W9W9W9W9" },
      { title: "Tense Rules", id: "8W8W8W8W8W8" },
      { title: "Tense Examples", id: "7W7W7W7W7W7" }
    ]
  },
  articles: {
    title: "Articles",
    description: "The Little Helpers",
    image: "https://picsum.photos/seed/articles/800/450",
    body: "Articles are small words that come before nouns. 'The' is used for specific things, while 'A' and 'An' are used for general things. Remember: use 'An' before words that start with a vowel sound!",
    examples: ["The Sun", "A book", "An apple", "An hour"],
    videos: [
      { title: "A, An, The", id: "6W6W6W6W6W6" },
      { title: "Article Rules", id: "5W5W5W5W5W5" },
      { title: "Article Quiz", id: "4W4W4W4W4W4" }
    ]
  },
  prepositions: {
    title: "Prepositions",
    description: "The Position Words",
    image: "https://picsum.photos/seed/prepositions/800/450",
    body: "Prepositions are words that tell us where something is! They show the relationship between a noun and another part of the sentence. Words like 'in', 'on', 'under', and 'behind' are all prepositions.",
    examples: ["The ball is IN the box.", "Pikachu is ON the table.", "The cat is UNDER the chair."],
    videos: [
      { title: "Prepositions for Kids", id: "xyMrLQ4ZI-4" },
      { title: "On, In, Under Song", id: "8F0NYBBK7as" },
      { title: "Where is it?", id: "j3S3S3S3S3S" }
    ]
  }
};

const QUIZ_DATA: Record<string, Question[]> = {
  nouns: [
    { id: 1, text: "Which of these is a noun?", options: ["Run", "Pikachu", "Quickly", "Happy"], correctAnswer: "Pikachu" },
    { id: 2, text: "Find the place noun in this list:", options: ["Apple", "Teacher", "School", "Jump"], correctAnswer: "School" },
    { id: 3, text: "A noun is a naming word. True or False?", options: ["True", "False"], correctAnswer: "True" },
    { id: 4, text: "Which is a 'thing' noun?", options: ["Doctor", "Paris", "Pencil", "Sing"], correctAnswer: "Pencil" },
    { id: 5, text: "Is 'Love' a noun?", options: ["Yes", "No"], correctAnswer: "Yes" },
  ],
  verbs: [
    { id: 1, text: "Which word is an action word (verb)?", options: ["Table", "Sing", "Blue", "Friend"], correctAnswer: "Sing" },
    { id: 2, text: "Pikachu ____ very fast.", options: ["runs", "yellow", "ball", "happy"], correctAnswer: "runs" },
    { id: 3, text: "I ____ my homework every day.", options: ["do", "is", "am", "are"], correctAnswer: "do" },
    { id: 4, text: "Birds ____ in the sky.", options: ["fly", "blue", "nest", "high"], correctAnswer: "fly" },
    { id: 5, text: "Which is NOT a verb?", options: ["Jump", "Eat", "Apple", "Sleep"], correctAnswer: "Apple" },
  ],
  tenses: [
    { id: 1, text: "Which sentence is in the Past Tense?", options: ["I eat an apple", "I will eat an apple", "I ate an apple"], correctAnswer: "I ate an apple" },
    { id: 2, text: "I ____ to school tomorrow.", options: ["went", "go", "will go", "gone"], correctAnswer: "will go" },
    { id: 3, text: "She ____ a book right now.", options: ["read", "is reading", "reads", "will read"], correctAnswer: "is reading" },
    { id: 4, text: "Yesterday, we ____ soccer.", options: ["play", "played", "playing", "will play"], correctAnswer: "played" },
    { id: 5, text: "Which is Future Tense?", options: ["I sang", "I sing", "I will sing"], correctAnswer: "I will sing" },
  ],
  articles: [
    { id: 1, text: "Use the correct article: ___ elephant.", options: ["A", "An", "The"], correctAnswer: "An" },
    { id: 2, text: "I saw ___ moon last night.", options: ["a", "an", "the"], correctAnswer: "the" },
    { id: 3, text: "She wants ___ orange.", options: ["a", "an", "the"], correctAnswer: "an" },
    { id: 4, text: "He is ___ honest man.", options: ["a", "an", "the"], correctAnswer: "an" },
    { id: 5, text: "This is ___ beautiful flower.", options: ["a", "an", "the"], correctAnswer: "a" },
  ],
  prepositions: [
    { id: 1, type: 'multiple-choice', text: "The book is ____ the table.", options: ["on", "in", "under"], correctAnswer: "on" },
    { id: 2, type: 'true-false', text: "Is 'under' a preposition of place?", options: ["True", "False"], correctAnswer: "True" },
    { id: 3, type: 'fill-in-blank', text: "The cat is hiding ____ the bed. (Hint: It's below the bed)", options: ["under", "on", "in"], correctAnswer: "under" },
    { id: 4, type: 'multiple-choice', text: "Pikachu is standing ____ Ash.", options: ["next to", "on", "under"], correctAnswer: "next to" },
    { id: 5, type: 'true-false', text: "In the sentence 'I am in the room', 'room' is the preposition.", options: ["True", "False"], correctAnswer: "False" },
    { 
      id: 6, 
      type: 'match', 
      text: "Match the preposition to its meaning:", 
      pairs: [
        { left: "In", right: "Inside something" },
        { left: "On", right: "Touching a surface" },
        { left: "Under", right: "Below something" }
      ],
      options: [],
      correctAnswer: "all-matched"
    }
  ]
};

const SIMPLER_QUIZ_DATA: Record<string, Question[]> = {
  nouns: [
    { id: 1, text: "Is 'Dog' a noun?", options: ["Yes", "No"], correctAnswer: "Yes" },
    { id: 2, text: "Which one is a person?", options: ["Boy", "Park", "Toy"], correctAnswer: "Boy" },
    { id: 3, text: "Which one is a place?", options: ["Home", "Book", "Run"], correctAnswer: "Home" },
  ],
  verbs: [
    { id: 1, text: "Is 'Jump' an action?", options: ["Yes", "No"], correctAnswer: "Yes" },
    { id: 2, text: "Which one is doing something?", options: ["Eating", "Table", "Green"], correctAnswer: "Eating" },
    { id: 3, text: "Can you 'Run'?", options: ["Yes", "No"], correctAnswer: "Yes" },
  ],
  tenses: [
    { id: 1, text: "Is 'Yesterday' about the past?", options: ["Yes", "No"], correctAnswer: "Yes" },
    { id: 2, text: "Is 'Tomorrow' about the future?", options: ["Yes", "No"], correctAnswer: "Yes" },
    { id: 3, text: "Is 'Now' about the present?", options: ["Yes", "No"], correctAnswer: "Yes" },
  ],
  articles: [
    { id: 1, text: "Do we use 'An' for 'Apple'?", options: ["Yes", "No"], correctAnswer: "Yes" },
    { id: 2, text: "Do we use 'A' for 'Cat'?", options: ["Yes", "No"], correctAnswer: "Yes" },
    { id: 3, text: "Is 'The' for specific things?", options: ["Yes", "No"], correctAnswer: "Yes" },
  ],
  prepositions: [
    { id: 1, text: "Is 'On' about where something is?", options: ["Yes", "No"], correctAnswer: "Yes" },
    { id: 2, text: "Is 'Under' below something?", options: ["Yes", "No"], correctAnswer: "Yes" },
    { id: 3, text: "Is 'In' inside something?", options: ["Yes", "No"], correctAnswer: "Yes" },
  ]
};

// --- Components ---

const GrammaChu = ({ reaction = 'happy', message, customSprite }: { reaction?: 'happy' | 'thinking' | 'sad' | 'excited' | 'surprised' | 'sleeping' | 'cheering' | 'confused' | 'victory', message?: string, customSprite?: string | null }) => {
  const messages = {
    happy: "Ready to begin!",
    thinking: "Let's explore!",
    sad: "Keep going, Trainer!",
    excited: "Excellent work!",
    surprised: "Wow! You're fast!",
    sleeping: "Zzz... Grammar is fun...",
    cheering: "You can do it!",
    confused: "Hmm, let's try again?",
    victory: "Mastery achieved!"
  };

  const sprites = {
    happy: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png", // Pikachu
    thinking: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/54.png", // Psyduck
    sad: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/816.png", // Sobble
    excited: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png", // Eevee
    surprised: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/175.png", // Togepi
    sleeping: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png", // Snorlax
    cheering: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/311.png", // Plusle
    confused: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/54.png", // Psyduck
    victory: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png", // Dragonite
  };

  return (
    <motion.div 
      className="relative w-24 h-24 mx-auto mb-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.img 
        key={reaction}
        src={customSprite || sprites[reaction]} 
        alt={reaction}
        className="w-full h-full object-contain drop-shadow-2xl"
        referrerPolicy="no-referrer"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <AnimatePresence>
        <motion.div 
          key={reaction}
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute -top-10 -right-16 bg-white px-4 py-2 rounded-full shadow-sm border border-stone-100 text-[11px] font-bold uppercase tracking-widest text-muted whitespace-nowrap z-10"
        >
          {message || messages[reaction]}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

const AshMascot = ({ message, type = 'default', customSprite }: { message: string, type?: 'default' | 'tip' | 'warning' | 'success', customSprite?: string | null }) => {
  const icons = {
    default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/1.png",
    tip: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/1.png",
    warning: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/1.png",
    success: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/1.png",
  };

  const colors = {
    default: "border-primary/20 bg-white",
    tip: "border-orange-200 bg-orange-50/30",
    warning: "border-rose-200 bg-rose-50/30",
    success: "border-teal-200 bg-teal-50/30",
  };

  const labels = {
    default: "Ash Ketchum",
    tip: "Pro Tip",
    warning: "Heads Up!",
    success: "Great Job!"
  };

  return (
    <motion.div 
      className={`flex items-center gap-6 p-6 rounded-[32px] shadow-md border ${colors[type]}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="w-20 h-20 bg-stone-50 rounded-3xl overflow-hidden border border-stone-100 shrink-0 flex items-center justify-center">
        <img 
          src={customSprite || icons[type]} 
          alt="Ash" 
          className="w-16 h-16 object-contain scale-150"
          referrerPolicy="no-referrer"
        />
      </div>
      <div>
        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
          type === 'tip' ? 'text-orange-600' : 
          type === 'warning' ? 'text-rose-600' : 
          type === 'success' ? 'text-teal-600' : 'text-primary'
        }`}>
          {labels[type]}
        </p>
        <p className="text-sm font-bold text-ink leading-tight">"{message}"</p>
      </div>
    </motion.div>
  );
};

const InteractivePractice = ({ lessonId, onComplete, assets: sharedAssets }: { lessonId: string, onComplete: () => void, assets?: any }) => {
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [currentPreposition, setCurrentPreposition] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mascotReaction, setMascotReaction] = useState<'happy' | 'thinking' | 'sad' | 'excited' | 'confused'>('happy');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { assets: localAssets, loading, error, generate } = useAssets();

  const assets = sharedAssets || localAssets;

  // AUTHENTIC TEAM DATA
  const leaderboard = [
    { name: "Ardra A S", xp: 980, rank: 1 },
    { name: "Devika Chandan D", xp: 945, rank: 2 },
    { name: "Samyukta Sanil", xp: 920, rank: 3 },
    { name: "Aksa Susan Abraham", xp: 890, rank: 4 }
  ];

  // Initial asset generation
  React.useEffect(() => {
    if (lessonId === 'prepositions' && !assets.bg && !loading && !sharedAssets) {
      generate();
    }
  }, [lessonId, assets.bg, loading]);
  
  const levels = [
    { 
      instruction: "Place Eevee IN the turquoise water", 
      target: "in", 
      object: "Eevee",
      sprite: assets.eevee || "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png",
      scale: 0.7
    },
    { 
      instruction: "Place Snorlax ON the light-oak bench", 
      target: "on", 
      object: "Snorlax",
      sprite: assets.snorlax || "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png",
      scale: 0.6
    },
    { 
      instruction: "Place Eevee UNDER the wooden bench", 
      target: "under", 
      object: "Eevee",
      sprite: assets.eevee || "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png",
      scale: 0.7
    }
  ];

  if (lessonId !== 'prepositions') {
    return (
      <div className="max-w-2xl w-full flex flex-col items-center">
        <div className="text-center mb-12">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Interactive Practice</p>
          <h2 className="text-4xl font-serif italic mb-4">Mastering {lessonId}</h2>
          <p className="text-muted font-medium">Practice makes perfect! Let's do a quick review challenge.</p>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-[40px] shadow-xl border border-stone-50 text-center w-full"
        >
          <GrammaChu reaction="happy" message="Let's do this!" />
          <div className="my-10 p-8 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200">
            <p className="text-lg font-medium text-ink mb-2">Mini-Challenge:</p>
            <p className="text-muted italic">"Can you identify 3 {lessonId} in your favorite book?"</p>
          </div>
          
          <button 
            onClick={onComplete}
            className="w-full py-5 bg-ink text-white font-bold rounded-2xl hover:bg-stone-800 transition-all flex items-center justify-center gap-3 shadow-xl btn-plushy"
          >
            I'm Ready for the Quiz!
            <ArrowRight size={20} />
          </button>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] w-full bg-stone-50 rounded-[40px] border-2 border-dashed border-stone-200">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-lg font-serif italic text-muted">Generating High-Fidelity Assets...</p>
        <p className="text-xs text-stone-400 mt-2">Studio Ghibli style loading...</p>
      </div>
    );
  }

  const currentLevel = levels[step];

  const updatePreposition = (point: { x: number, y: number }) => {
    if (!containerRef.current) return "none";
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // 1. COORDINATE NORMALIZATION (Medical Accuracy)
    const scaleX = 800 / containerRect.width;
    const scaleY = 450 / containerRect.height; // Adjusted for 16:9
    const dropX = (point.x - containerRect.left) * scaleX;
    const dropY = (point.y - containerRect.top) * scaleY;
    
    // 2. RIGID HITBOX DEFINITIONS (Medical Accuracy - Adjusted for 16:9)
    // TARGET ONE (IN WATER): Centers at (450, 306) with radius (220, 54)
    const isInWater = (Math.pow(dropX - 450, 2) / Math.pow(220, 2)) + 
                      (Math.pow(dropY - 306, 2) / Math.pow(54, 2)) <= 1;
    
    // TARGET TWO (UNDER BENCH): Gap beneath seat
    const isUnderBench = dropX > 600 && dropX < 780 && dropY > 342 && dropY < 432;

    // TARGET THREE (ON DECK): Surface of the deck/bench
    const isOnDeck = dropY > 288 && !isUnderBench;

    // 4. PREPOSITION DETERMINATION
    let prep = "none";
    if (isUnderBench) prep = "under";
    else if (isOnDeck && dropX > 600 && dropX < 780 && dropY < 342) prep = "on"; // Specifically on bench
    else if (isOnDeck) prep = "on";
    else if (isInWater) prep = "in";
    else if (dropY < 150) prep = "above"; 
    else prep = "near";

    if (prep !== currentPreposition) setCurrentPreposition(prep === "none" ? null : prep);
    return prep;
  };

  const handleDragEnd = (event: any, info: any) => {
    setIsDragging(false);
    const dropZone = updatePreposition(info.point);

    if (dropZone === currentLevel.target) {
      setFeedback("Excellent! Perfect Accuracy.");
      setIsCorrect(true);
      setMascotReaction('excited');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } else {
      setFeedback(`Placement: ${dropZone.toUpperCase()}. Target: ${currentLevel.target.toUpperCase()}. Try again!`);
      setIsCorrect(false);
      setMascotReaction('confused');
    }
    setCurrentPreposition(null);
  };

  const nextStep = () => {
    if (step < levels.length - 1) {
      setStep(s => s + 1);
      setFeedback(null);
      setIsCorrect(false);
      setMascotReaction('happy');
    } else {
      onComplete();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-10 bg-[#1a1c1e] min-h-screen items-center justify-center w-full">
      
      {/* 3D SCENE CONTAINER */}
      <div className="flex flex-col items-center flex-grow max-w-5xl">
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 items-start">
          <div className="lg:col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Calibration: Level {step + 1}</p>
            <h2 className="text-4xl font-serif italic mb-2 text-white">{currentLevel.instruction}</h2>
            {error && (
              <div className="mt-2 text-xs text-rose-500 bg-rose-50 p-2 rounded-lg border border-rose-100 flex items-center gap-2">
                <ChevronRight size={12} className="rotate-90" />
                Generation Error: {error}. <button onClick={() => generate()} className="underline font-bold">Retry</button>
              </div>
            )}
          </div>
          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              <AshMascot 
                type={isCorrect ? 'success' : feedback ? 'warning' : 'tip'} 
                message={feedback || "Align the character center with the target zone."} 
                customSprite={assets.ash}
              />
            </AnimatePresence>
          </div>
        </div>

        <div 
          ref={containerRef}
          className="relative w-full aspect-video rounded-[50px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] border-[12px] border-[#2a2d30]"
          style={{ perspective: '1000px' }}
        >
          {/* LAYER 1: FAR BACKGROUND (Mountains) */}
          <div className="absolute inset-0 z-0">
            {assets.bg ? (
              <img 
                src={assets.bg} 
                alt="Onsen Battlefield" 
                className="w-full h-full object-cover scale-110" 
                style={{ transform: 'translateZ(-100px)' }}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="absolute inset-0 bg-stone-800 flex items-center justify-center">
                <p className="text-stone-500 font-serif italic">Background Loading...</p>
              </div>
            )}
          </div>

          {/* HITBOX VISUAL HELPERS (DEBUG MODE - SUBTLE) */}
          {isDragging && (
            <svg viewBox="0 0 800 450" className="absolute inset-0 w-full h-full pointer-events-none opacity-20 z-10">
              <ellipse cx="450" cy="306" rx="220" ry="54" fill="cyan" />
              <rect x="600" y="342" width="180" height="90" fill="yellow" />
              <rect x="600" y="288" width="180" height="54" fill="orange" />
            </svg>
          )}

          {/* LAYER 2: INTERACTIVE SPRITE */}
          <motion.div
            drag
            dragConstraints={containerRef}
            onDragStart={() => {
              setIsDragging(true);
              setFeedback(null);
            }}
            onDrag={(e, info) => updatePreposition(info.point)}
            onDragEnd={handleDragEnd}
            className="absolute left-10 top-1/2 -translate-y-1/2 z-20 cursor-grab active:cursor-grabbing touch-none"
            initial={{ x: 0, y: 0 }}
            key={step}
          >
            <div className="relative">
              <AnimatePresence>
                {isDragging && currentPreposition && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: -50 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute left-1/2 -translate-x-1/2 bg-ink text-white px-3 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-2 whitespace-nowrap"
                  >
                    <Sparkles size={10} className="text-yellow-400" />
                    {currentPreposition}
                  </motion.div>
                )}
              </AnimatePresence>
              <img 
                src={currentLevel.sprite} 
                alt={currentLevel.object} 
                style={{ transform: `scale(${currentLevel.scale})` }}
                className="w-32 h-32 object-contain drop-shadow-[0_30px_15px_rgba(0,0,0,0.4)]"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>

          {/* LAYER 3: FOREGROUND OVERLAY (Bench & Mist) */}
          <div className="absolute inset-0 pointer-events-none z-30 bg-gradient-to-t from-black/20 to-transparent" />
          
          {/* Mascot in Scene */}
          <div className="absolute right-10 top-10 scale-110 origin-top-right pointer-events-none z-40">
            <GrammaChu 
              reaction={mascotReaction} 
              message={isCorrect ? "Perfect!" : feedback ? "Try again!" : "Where should it go?"} 
              customSprite={assets.ash}
            />
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          {isCorrect && (
            <button 
              onClick={nextStep} 
              className="px-12 py-5 bg-teal-600 text-white font-bold rounded-2xl shadow-xl btn-plushy flex items-center gap-3"
            >
              {step < levels.length - 1 ? "Next Calibration" : "Proceed to Final Quiz"}
              <ArrowRight size={20} />
            </button>
          )}
          <button 
            onClick={() => generate()}
            className="px-6 py-5 bg-[#2a2d30] text-stone-400 font-bold rounded-2xl border border-white/5 hover:text-white transition-all flex items-center gap-2"
          >
            <Loader2 size={16} className={loading ? "animate-spin" : ""} />
            Regenerate Scene
          </button>
        </div>
      </div>

      {/* TEAM LEADERBOARD SIDEBAR */}
      <div className="w-full lg:w-80 bg-[#2a2d30] rounded-[40px] p-8 border border-white/5 shadow-2xl self-start lg:mt-24">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-amber-500/20 rounded-2xl">
            <Trophy className="text-amber-500" size={24} />
          </div>
          <h3 className="text-white font-black text-lg tracking-tight">TEAM RANKINGS</h3>
        </div>

        <div className="space-y-3">
          {leaderboard.map((p, i) => (
            <div key={p.name} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                {i === 0 ? <Crown size={16} className="text-amber-400" /> : <Star size={16} className="text-stone-500" />}
                <span className="text-sm font-bold text-stone-200">{p.name}</span>
              </div>
              <span className="text-xs font-black text-amber-500">{p.xp} XP</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const QuizPage = ({ lessonId, isSimpler = false, onComplete }: { lessonId: string, isSimpler?: boolean, onComplete: (score: number) => void }) => {
  const questions = (isSimpler ? SIMPLER_QUIZ_DATA[lessonId] : QUIZ_DATA[lessonId]) || [];
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  
  // For Match type questions
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  const currentQuestion = questions[currentQuestionIdx];

  const handleNext = () => {
    let isCorrect = false;
    
    if (currentQuestion.type === 'match') {
      const allCorrect = currentQuestion.pairs?.every(p => matches[p.left] === p.right);
      isCorrect = !!allCorrect;
    } else {
      isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    }

    if (isCorrect) {
      setScore(s => s + 1);
    }

    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setMatches({});
      setSelectedLeft(null);
    } else {
      setShowResult(true);
      const finalScore = isCorrect ? score + 1 : score;
      const percentage = (finalScore / questions.length) * 100;
      
      const threshold = isSimpler ? 75 : 70;

      if (percentage >= threshold) {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
        const interval: any = setInterval(function() {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) return clearInterval(interval);
          const particleCount = 50 * (timeLeft / duration);
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
      }
    }
  };

  const handleMatch = (left: string, right: string) => {
    setMatches(prev => ({ ...prev, [left]: right }));
    setSelectedLeft(null);
  };

  if (showResult) {
    const percentage = (score / questions.length) * 100;
    const threshold = isSimpler ? 75 : 70;
    const passed = percentage >= threshold;

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-10 rounded-[40px] shadow-xl border border-stone-50 text-center"
      >
        <GrammaChu reaction={passed ? 'victory' : 'confused'} />
        <h2 className="text-4xl font-serif italic mb-2">{isSimpler ? "Practice Quiz" : "Quiz Complete!"}</h2>
        <div className="my-8">
          <div className={`text-6xl font-black mb-2 ${passed ? 'text-green-600' : 'text-primary'}`}>{Math.round(percentage)}%</div>
          <p className="text-muted font-medium">You got {score} out of {questions.length} correct!</p>
        </div>
        
        <div className="mb-10">
          <AshMascot 
            type={passed ? 'success' : 'warning'} 
            message={passed 
              ? "Great job! You've mastered this concept. Ready for the next challenge?" 
              : "Don't give up! Every Master was once a beginner. Let's try a different approach."} 
          />
        </div>

        <div className="space-y-3">
          {passed ? (
            <button 
              onClick={() => onComplete(percentage)}
              className="w-full bg-ink text-white font-bold py-5 rounded-2xl hover:bg-stone-800 transition-all flex items-center justify-center gap-3 btn-plushy"
            >
              {isSimpler ? "Return to Main Quiz" : "Finish Module"}
              <CheckCircle2 size={18} />
            </button>
          ) : (
            <>
              <button 
                onClick={() => onComplete(percentage)}
                className="w-full bg-primary text-white font-bold py-5 rounded-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 btn-plushy"
              >
                {isSimpler ? "Watch Videos" : "Try Simpler Quiz"}
                <ArrowRight size={18} />
              </button>
              {!isSimpler && (
                <button 
                  onClick={() => onComplete(-1)} // Special code for "Watch Videos" from main quiz
                  className="w-full bg-stone-100 text-ink font-bold py-5 rounded-2xl hover:bg-stone-200 transition-all flex items-center justify-center gap-3"
                >
                  Watch Videos Instead
                  <Play size={18} />
                </button>
              )}
            </>
          )}
        </div>
      </motion.div>
    );
  }

  const isMatchComplete = currentQuestion.type === 'match' && Object.keys(matches).length === (currentQuestion.pairs?.length || 0);

  return (
    <div className="max-w-2xl w-full">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
            {isSimpler ? "Practice Question" : "Question"} {currentQuestionIdx + 1} of {questions.length}
          </p>
          <h2 className="text-3xl font-serif italic">
            {currentQuestion.type === 'match' ? 'Match the Following' : 
             currentQuestion.type === 'true-false' ? 'True or False?' :
             currentQuestion.type === 'fill-in-blank' ? 'Fill in the Blank' :
             isSimpler ? "Let's Practice!" : "Test your knowledge"}
          </h2>
        </div>
        <div className="w-32 h-2 bg-stone-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <motion.div 
        key={currentQuestion.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white p-10 rounded-[40px] shadow-xl border border-stone-50"
      >
        <h3 className="text-2xl font-medium text-ink mb-10 leading-snug">
          {currentQuestion.text}
        </h3>

        {currentQuestion.type === 'match' ? (
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              {currentQuestion.pairs?.map((p) => (
                <button
                  key={p.left}
                  onClick={() => setSelectedLeft(p.left)}
                  className={`w-full p-4 rounded-xl text-left font-bold border-2 transition-all ${
                    selectedLeft === p.left ? 'border-primary bg-primary/5' : 
                    matches[p.left] ? 'border-green-500 bg-green-50 opacity-50' : 'border-stone-100'
                  }`}
                  disabled={!!matches[p.left]}
                >
                  {p.left}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {currentQuestion.pairs?.map((p) => (
                <button
                  key={p.right}
                  onClick={() => selectedLeft && handleMatch(selectedLeft, p.right)}
                  className={`w-full p-4 rounded-xl text-left font-bold border-2 transition-all ${
                    Object.values(matches).includes(p.right) ? 'border-green-500 bg-green-50 opacity-50' : 
                    selectedLeft ? 'border-primary/50 hover:border-primary' : 'border-stone-100 cursor-not-allowed'
                  }`}
                  disabled={Object.values(matches).includes(p.right)}
                >
                  {p.right}
                </button>
              ))}
            </div>
            <div className="col-span-2 mt-6 p-4 bg-stone-50 rounded-2xl border border-stone-100">
              <p className="text-xs font-bold uppercase tracking-widest text-muted mb-2">Current Matches:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(matches).map(([l, r]) => (
                  <span key={l} className="px-3 py-1 bg-white border border-stone-200 rounded-full text-xs font-medium">
                    {l} → {r}
                  </span>
                ))}
                {Object.keys(matches).length === 0 && <span className="text-xs text-stone-400 italic">No matches yet...</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {currentQuestion.options.map((option) => (
              <button
                key={option}
                onClick={() => setSelectedAnswer(option)}
                className={`w-full p-6 rounded-2xl text-left font-bold transition-all border-2 flex items-center justify-between group btn-plushy ${
                  selectedAnswer === option 
                    ? 'bg-primary/5 border-primary text-primary' 
                    : 'bg-white border-stone-100 text-stone-600 hover:border-stone-300'
                }`}
              >
                <span>{option}</span>
                {selectedAnswer === option ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-stone-200 group-hover:text-stone-300" />}
              </button>
            ))}
          </div>
        )}

        <button
          disabled={currentQuestion.type === 'match' ? !isMatchComplete : !selectedAnswer}
          onClick={handleNext}
          className={`w-full mt-10 py-5 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 btn-plushy ${
            (currentQuestion.type === 'match' ? isMatchComplete : selectedAnswer)
              ? 'bg-ink text-white hover:bg-stone-800 shadow-lg' 
              : 'bg-stone-100 text-stone-400 cursor-not-allowed'
          }`}
        >
          {currentQuestionIdx === questions.length - 1 ? "Submit" : "Next"}
          <ArrowRight size={18} />
        </button>
      </motion.div>
    </div>
  );
};

const VideoPage = ({ lessonId, onDone }: { lessonId: string, onDone: () => void }) => {
  const content = LESSON_CONTENT[lessonId];
  if (!content) return null;

  return (
    <div className="max-w-6xl w-full">
      <div className="mb-12 flex justify-between items-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Visual Learning</p>
          <h1 className="text-5xl font-serif italic">Watch & Learn</h1>
        </div>
        <button 
          onClick={onDone}
          className="px-8 py-4 bg-ink text-white font-bold rounded-2xl hover:bg-stone-800 transition-all flex items-center gap-2 btn-plushy"
        >
          Done Watching <CheckCircle2 size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {content.videos.map((video, idx) => (
          <motion.div 
            key={video.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-stone-50 group"
          >
            <div className="aspect-video bg-stone-100 relative">
              <iframe 
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${video.id}`}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-ink mb-2">{video.title}</h3>
              <p className="text-xs text-muted font-medium">Click play to watch the explanation.</p>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-12">
        <AshMascot message="Visuals help our brains remember things better! Watch these to master the concept." />
      </div>
    </div>
  );
};

const ChooseActionPage = ({ lessonId, onWatchVideo, onStartQuiz, onStartPractice }: { lessonId: string, onWatchVideo: () => void, onStartQuiz: () => void, onStartPractice: () => void }) => {
  return (
    <div className="max-w-4xl w-full text-center">
      <GrammaChu reaction="surprised" message="What's next?" />
      <h1 className="text-5xl font-serif italic mb-6">Choose Your Path</h1>
      <p className="text-lg text-muted font-medium mb-12">Are you ready to test your skills, or would you like to practice first?</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <button 
          onClick={onWatchVideo}
          className="p-10 bg-white rounded-[40px] shadow-xl border border-stone-50 hover:border-primary/20 transition-all group text-left btn-plushy"
        >
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
            <Play size={32} className="text-primary" />
          </div>
          <h3 className="text-2xl font-serif italic mb-2">Watch Videos</h3>
          <p className="text-sm text-muted font-medium">See visual explanations.</p>
        </button>

        <button 
          onClick={onStartPractice}
          className="p-10 bg-white rounded-[40px] shadow-xl border border-stone-50 hover:border-orange-200 transition-all group text-left btn-plushy"
        >
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-100 transition-colors">
            <Sparkles size={32} className="text-orange-500" />
          </div>
          <h3 className="text-2xl font-serif italic mb-2">Interactive Practice</h3>
          <p className="text-sm text-muted font-medium">
            {lessonId === 'prepositions' ? 'Drag and drop simulation!' : 'Mini-challenge review!'}
          </p>
        </button>

        <button 
          onClick={onStartQuiz}
          className="p-10 bg-white rounded-[40px] shadow-xl border border-stone-50 hover:border-green/20 transition-all group text-left btn-plushy"
        >
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-100 transition-colors">
            <Trophy size={32} className="text-green-600" />
          </div>
          <h3 className="text-2xl font-serif italic mb-2">Final Quiz</h3>
          <p className="text-sm text-muted font-medium">Jump straight into the test!</p>
        </button>
      </div>
    </div>
  );
};

const LessonContentPage = ({ lessonId, onContinue }: { lessonId: string, onContinue: () => void }) => {
  const content = LESSON_CONTENT[lessonId];
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [step, setStep] = useState(0);

  if (!content) return null;

  const steps = [
    { title: "The Concept", content: content.body, reaction: 'thinking' as const, ash: "Every great Trainer starts with the basics!" },
    { title: "Examples", content: "Let's look at how we use this in real sentences.", reaction: 'happy' as const, ash: "Check out these examples! They're like battle moves for your brain." },
    { title: "Ready for Battle?", content: "You've learned the core ideas. Now it's time to test your skills!", reaction: 'excited' as const, ash: "I choose you! Let's show them what you've learned." }
  ];

  const handleTTS = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = step === 0 ? content.body : step === 1 ? content.examples.join(". ") : "Ready to start the quiz?";
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-5xl w-full">
      <div className="mb-12 flex justify-end">
        <AshMascot message={steps[step].ash} type={step === 1 ? 'tip' : 'default'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-8 space-y-8">
          <motion.div 
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-12 rounded-[40px] shadow-xl border border-stone-50"
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Step {step + 1} of {steps.length}</p>
                <h1 className="text-5xl font-serif italic">{steps[step].title}</h1>
              </div>
              <button 
              onClick={handleTTS}
              className={`p-4 rounded-2xl transition-all btn-plushy ${isSpeaking ? 'bg-primary text-white' : 'bg-stone-50 text-muted hover:bg-stone-100'}`}
            >
              <Volume2 size={24} />
            </button>
            </div>

            <div className="min-h-[150px]">
              {step === 0 && (
                <p className="text-lg text-muted font-medium mb-12 leading-relaxed">
                  {content.body}
                </p>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <p className="text-lg text-muted font-medium mb-6">Study these examples carefully:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {content.examples.map((ex, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex items-center gap-3"
                      >
                        <CheckCircle2 size={18} className="text-primary" />
                        <span className="font-bold text-ink">{ex}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="text-center py-8">
                  <p className="text-xl text-muted font-medium mb-8">
                    You've completed the lesson! Are you ready to earn your badge?
                  </p>
                  <div className="flex justify-center gap-4">
                    <div className="w-16 h-16 bg-pikachu/20 rounded-full flex items-center justify-center">
                      <Award size={32} className="text-pikachu" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-12">
              {step > 0 && (
                <button 
                onClick={() => setStep(s => s - 1)}
                className="flex-1 bg-stone-100 text-ink font-bold py-6 rounded-2xl hover:bg-stone-200 transition-all flex items-center justify-center gap-3 btn-plushy"
              >
                <ChevronLeft size={20} />
                Previous
              </button>
              )}
              {lessonId === 'prepositions' && step < steps.length - 1 && (
                <button 
                  onClick={onContinue}
                  className="flex-1 bg-orange-50 text-orange-600 font-bold py-6 rounded-2xl hover:bg-orange-100 transition-all flex items-center justify-center gap-3 btn-plushy border border-orange-200"
                >
                  <Sparkles size={20} />
                  Skip to Practice
                </button>
              )}
              <button 
                onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : onContinue()}
                className="flex-[2] bg-primary text-white font-bold py-6 rounded-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-lg shadow-primary/20 btn-plushy"
              >
                {step < steps.length - 1 
                  ? "Next Step" 
                  : lessonId === 'prepositions' ? "Continue to Practice" : "Continue to Quiz"}
                <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[40px] overflow-hidden shadow-2xl border-8 border-white"
          >
            <img 
              src={content.image} 
              alt={content.title} 
              className="w-full h-auto object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>

          <div className="bg-pikachu/10 p-8 rounded-[40px] border border-pikachu/20">
            <GrammaChu 
              reaction={isSpeaking ? 'surprised' : steps[step].reaction} 
              message={isSpeaking ? "Listening carefully..." : undefined} 
            />
            <p className="text-sm text-stone-700 font-bold italic text-center leading-relaxed mt-4">
              "Did you know? {content.title} are like the {step === 0 ? 'foundation' : step === 1 ? 'moves' : 'victory'} of every sentence!"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const login = useStore((state) => state.login);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      login(username, 'Class 2');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-12 rounded-[40px] shadow-xl border border-stone-100 text-center"
      >
        <div className="mb-10">
          <div className="w-24 h-24 bg-pikachu/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <GraduationCap size={48} className="text-primary" />
          </div>
          <h1 className="text-4xl font-serif italic mb-2">GrammarPal</h1>
          <p className="text-muted font-medium">Your journey to mastery begins here.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-left">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1 mb-2 block">Student Name</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-stone-50 border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none font-medium text-ink"
              placeholder="Enter your name..."
              required
            />
          </div>
          
          <button 
            type="submit"
            className="w-full bg-ink text-white font-bold py-5 rounded-2xl shadow-lg hover:bg-stone-800 transition-all flex items-center justify-center gap-2 group btn-plushy"
          >
            Start Learning
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const Navbar = ({ user, onLogout, onBack, showBack }: { user: any, onLogout: () => void, onBack?: () => void, showBack?: boolean }) => {
  return (
    <nav className="px-8 py-6 flex justify-between items-center max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ink rounded-xl flex items-center justify-center">
            <GraduationCap size={20} className="text-white" />
          </div>
          <span className="font-serif text-2xl italic tracking-tight">GrammarPal</span>
        </div>
        {showBack && onBack && (
          <motion.button 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-100 shadow-sm hover:bg-stone-50 transition-all text-muted hover:text-ink font-bold text-[10px] uppercase tracking-widest btn-plushy"
          >
            <ChevronLeft size={14} /> Back to Dashboard
          </motion.button>
        )}
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{user?.class}</p>
          <p className="font-serif text-lg italic">{user?.username}</p>
        </div>
        <button 
          onClick={onLogout}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors text-muted"
        >
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
};

const HomeScreen = ({ assets, loading, error, onRetry }: { assets: any, loading: boolean, error: string | null, onRetry: () => void }) => {
  const user = useStore((state) => state.user);
  const setLesson = useStore((state) => state.setLesson);

  const lessons = [
    { id: 'nouns', title: 'Nouns', color: '#60a5fa', icon: <Sparkles className="text-white" size={20} /> },
    { id: 'verbs', title: 'Verbs', color: '#4ade80', icon: <Play className="text-white" size={20} /> },
    { id: 'tenses', title: 'Tenses', color: '#c084fc', icon: <ChevronRight className="text-white" size={20} /> },
    { id: 'articles', title: 'Articles', color: '#facc15', icon: <Trophy className="text-white" size={20} /> },
    { id: 'prepositions', title: 'Prepositions', color: '#fb923c', icon: <ArrowRight className="text-white" size={20} /> },
  ];

  return (
    <main className="min-h-screen w-full bg-[#fdf6e3] relative overflow-hidden flex flex-col">
      {/* Onsen Background */}
      {assets.bg ? (
        <div className="absolute inset-0 z-0">
          <img 
            src={assets.bg} 
            alt="Background" 
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-teal-100/40 to-white/80" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-teal-100/30 to-teal-500/10 pointer-events-none" />
      )}
      
      {/* Wooden Deck (Bottom) */}
      <div className="absolute bottom-0 w-full h-1/4 bg-[#8b5e3c] border-t-8 border-[#5d3a1a] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] z-10" />
      
      <div className="relative z-20 max-w-7xl mx-auto px-8 py-12 w-full flex-grow flex flex-col">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-5xl font-serif italic mb-2 leading-tight">
              Welcome back, <br />
              <span className="text-teal-800 not-italic font-sans font-extrabold tracking-tighter">Trainer {user?.username}</span>
            </h2>
            <p className="text-stone-600 font-medium">Your journey to linguistic mastery continues.</p>
          </motion.div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-4 shadow-sm"
            >
              <div className="text-rose-600 text-xs font-bold">
                <p>Generation Limit Reached</p>
                <p className="font-normal opacity-70">Sequential retry active...</p>
              </div>
              <button 
                onClick={onRetry}
                disabled={loading}
                className="px-4 py-2 bg-rose-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-all disabled:opacity-50"
              >
                {loading ? "Retrying..." : "Manual Retry"}
              </button>
            </motion.div>
          )}
        </header>

        {/* GrammaChu in Onsen */}
        <div className="flex flex-col items-center mb-20 relative">
          <div className="relative">
            {/* Water Ripples */}
            <motion.div 
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.1, 0.4] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute -inset-12 bg-teal-300/40 rounded-full blur-2xl"
            />
            <div className="relative z-10">
              <GrammaChu 
                reaction={loading ? 'thinking' : error ? 'confused' : 'happy'} 
                message={loading ? "Generating your world..." : error ? "Oops! The spirits are tired. Retry?" : "The water is perfect! Click a badge below to start your training battle!"} 
              />
              {/* Towel on head */}
              <motion.div 
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-3 bg-white rounded-full shadow-sm border border-stone-100"
                animate={{ y: [0, -1, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </div>
        </div>

        {/* Badge Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 justify-items-center mt-auto pb-12">
          {lessons.map((lesson, idx) => {
            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col items-center"
              >
                <button
                  onClick={() => setLesson(lesson.id)}
                  className={`relative group transition-all duration-500 hover:scale-110 cursor-pointer`}
                >
                  {/* Hexagonal Badge SVG */}
                  <div className="relative w-28 h-32">
                    <svg viewBox="0 0 100 115" className={`w-full h-full drop-shadow-xl transition-colors duration-500`}>
                      <path 
                        d="M50 5 L95 30 L95 85 L50 110 L5 85 L5 30 Z" 
                        fill={lesson.color}
                      />
                      <path 
                        d="M50 10 L90 33 L90 82 L50 105 L10 82 L10 33 Z" 
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeOpacity="0.2"
                      />
                    </svg>
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                      <motion.div 
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="flex flex-col items-center"
                      >
                        <div className="mb-1 drop-shadow-md">{lesson.icon}</div>
                        <span className="text-white font-black text-[10px] uppercase tracking-tighter drop-shadow-sm">{lesson.title}</span>
                        {lesson.id === 'prepositions' && (
                          <motion.div 
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="mt-1 px-2 py-0.5 bg-white text-orange-600 text-[8px] font-black rounded-full shadow-sm"
                          >
                            BATTLE
                          </motion.div>
                        )}
                      </motion.div>
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Soft Golden Light Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-200/5 via-transparent to-transparent pointer-events-none" />
    </main>
  );
};

// --- Main App ---

export default function App() {
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);
  const currentLesson = useStore((state) => state.currentLesson);
  const setLesson = useStore((state) => state.setLesson);
  const [view, setView] = useState<'lesson' | 'choose_action' | 'video' | 'quiz' | 'simpler_quiz' | 'practice'>('lesson');
  const { assets, loading, error, generate } = useAssets();

  const setScore = useStore((state) => state.setScore);

  React.useEffect(() => {
    if (user?.isLoggedIn && !assets.bg && !loading) {
      generate();
    }
  }, [user?.isLoggedIn]);

  const handleBackToDashboard = () => {
    setLesson('');
    setView('lesson');
  };

  const handleQuizComplete = (percentage: number) => {
    if (percentage >= 70) {
      setScore(Math.round(percentage)); // Add XP based on percentage
      setLesson('');
      setView('lesson');
    } else if (percentage === -1) {
      setView('video');
    } else {
      setView('simpler_quiz');
    }
  };

  const handleSimplerQuizComplete = (percentage: number) => {
    if (percentage >= 75) {
      setView('quiz');
    } else {
      setView('video');
    }
  };

  return (
    <div className="antialiased selection:bg-primary/10 min-h-screen bg-surface subtle-grain">
      {user?.isLoggedIn && (
        <Navbar 
          user={user} 
          onLogout={logout} 
          onBack={handleBackToDashboard} 
          showBack={!!currentLesson} 
        />
      )}
      <AnimatePresence mode="wait">
        {!user?.isLoggedIn ? (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoginPage />
          </motion.div>
        ) : !currentLesson ? (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
            <HomeScreen assets={assets} loading={loading} error={error} onRetry={generate} />
          </motion.div>
        ) : (
          <motion.div 
            key="content" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-8 w-full"
          >
            {view === 'lesson' && (
              <LessonContentPage 
                lessonId={currentLesson} 
                onContinue={() => {
                  if (currentLesson === 'prepositions') {
                    setView('practice');
                  } else {
                    setView('choose_action');
                  }
                }} 
              />
            )}
            {view === 'choose_action' && (
              <ChooseActionPage 
                lessonId={currentLesson}
                onWatchVideo={() => setView('video')}
                onStartQuiz={() => setView('quiz')}
                onStartPractice={() => setView('practice')}
              />
            )}
            {view === 'practice' && (
              <InteractivePractice 
                lessonId={currentLesson}
                onComplete={() => setView('quiz')}
                assets={assets}
              />
            )}
            {view === 'video' && (
              <VideoPage 
                lessonId={currentLesson}
                onDone={() => setView('choose_action')}
              />
            )}
            {view === 'quiz' && (
              <QuizPage 
                lessonId={currentLesson} 
                onComplete={handleQuizComplete} 
              />
            )}
            {view === 'simpler_quiz' && (
              <QuizPage 
                lessonId={currentLesson} 
                isSimpler={true}
                onComplete={handleSimplerQuizComplete} 
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
