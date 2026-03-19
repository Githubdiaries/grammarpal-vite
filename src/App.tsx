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
  ChevronDown,
  CheckCircle2,
  Circle,
  Award,
  Volume2,
  Lock,
  Loader2,
  Crown,
  Star,
  Leaf,
  X,
  Send,
  Mail,
  User
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

  const FALLBACK_ASSETS = {
    bg: "https://images.unsplash.com/photo-1542044896530-05d85be9b11a?q=80&w=1920&auto=format&fit=crop", // Serene Japanese landscape
    eevee: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png",
    snorlax: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png",
    ash: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png" // Using Pikachu as Ash fallback for simplicity
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const generateWithRetry = async (params: any, retries = 5, delay = 3000): Promise<any> => {
        try {
          return await ai.models.generateContent(params);
        } catch (err: any) {
          const errMsg = typeof err === 'string' ? err : (err.message || JSON.stringify(err));
          const isRateLimited = errMsg.includes("429") || err.status === 429 || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota");
          
          if (isRateLimited && retries > 0) {
            console.log(`Rate limited or quota hit. Retrying in ${delay}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return generateWithRetry(params, retries - 1, delay * 2);
          }
          throw err;
        }
      };

      // Sequential generation to avoid hitting concurrent request limits
      // We'll use a longer pause between assets to be safe
      const bgRes = await generateWithRetry({
        model: "gemini-2.5-flash-image",
        contents: [{
          text: "A professional, ultra-high-resolution 3-layer parallax game environment for a 2D-platformer. Background: Cinematic snow-capped Japanese mountains and a winding river at sunrise. Midground: A steaming turquoise hot spring pool with high-detail rock textures. Foreground: A dark-stained cedar wood balcony with a light-oak bench, presented in a slight isometric 3D perspective to show depth. Style: Professional high-fidelity anime concept art, Studio Ghibli inspired, volumetric lighting, serene atmosphere, 16:9 ratio. ZERO TEXT."
        }],
        config: { imageConfig: { aspectRatio: "16:9" } }
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const eeveeRes = await generateWithRetry({
        model: "gemini-2.5-flash-image",
        contents: [{
          text: "A high-resolution, full-body digital painting of Eevee, rendered in a Studio Ghibli-inspired art style. Eevee is standing, facing forward with a bright, engaged expression. The model has clean outlines and detailed fur texture. Plain white background."
        }],
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const snorlaxRes = await generateWithRetry({
        model: "gemini-2.5-flash-image",
        contents: [{
          text: "A high-resolution, full-body digital painting of Snorlax, rendered in a Studio Ghibli-inspired art style. Snorlax is wide, massive, and happy. Plain white background."
        }],
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

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
      console.error("Asset generation failed, using fallbacks:", err);
      const errMsg = typeof err === 'string' ? err : (err.message || JSON.stringify(err));
      
      // Automatically use fallbacks on quota error or any failure
      setAssets(FALLBACK_ASSETS);
      
      if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota")) {
        setError("The AI generation service has reached its limit. We've loaded our beautiful classic assets for you instead!");
      } else {
        setError("We had some trouble reaching the magic generator, so we've loaded our classic assets for your journey.");
      }
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
  },
  adjectives: {
    title: "Adjectives",
    description: "The Describing Words",
    image: "https://picsum.photos/seed/adjectives/800/450",
    body: "Adjectives are words that describe nouns! They tell us more about people, places, and things. They can describe color, size, shape, and even how something feels or tastes.",
    examples: ["The RED apple", "A BIG elephant", "The HAPPY boy", "A SWEET candy"],
    videos: [
      { title: "What is an Adjective?", id: "949W9W9W9W9" },
      { title: "Adjective Song", id: "848W8W8W8W8" },
      { title: "Describing Words", id: "747W7W7W7W7" }
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
  ],
  adjectives: [
    { id: 1, text: "Which word is an adjective?", options: ["Run", "Blue", "Table", "Quickly"], correctAnswer: "Blue" },
    { id: 2, text: "The ____ elephant is walking.", options: ["big", "run", "slowly", "he"], correctAnswer: "big" },
    { id: 3, text: "Adjectives describe nouns. True or False?", options: ["True", "False"], correctAnswer: "True" },
    { id: 4, text: "Which is a color adjective?", options: ["Happy", "Green", "Tall", "Soft"], correctAnswer: "Green" },
    { id: 5, text: "Find the adjective: 'The happy girl sang.'", options: ["The", "happy", "girl", "sang"], correctAnswer: "happy" },
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
  ],
  adjectives: [
    { id: 1, text: "Is 'Red' a color word?", options: ["Yes", "No"], correctAnswer: "Yes" },
    { id: 2, text: "Is 'Big' a size word?", options: ["Yes", "No"], correctAnswer: "Yes" },
    { id: 3, text: "Do adjectives describe things?", options: ["Yes", "No"], correctAnswer: "Yes" },
  ]
};

// --- Components ---

const GrammaChu = ({ reaction = 'happy', message, customSprite }: { reaction?: 'happy' | 'thinking' | 'sad' | 'excited' | 'surprised' | 'sleeping' | 'cheering' | 'confused' | 'victory', message?: string, customSprite?: string | null }) => {
  const messages = {
    happy: "Ready to begin!",
    thinking: "Let's explore!",
    sad: "Keep going!",
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
      className="relative w-24 h-24 mx-auto mb-10"
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
          className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-2xl shadow-xl border border-stone-100 text-[11px] font-bold uppercase tracking-widest text-teal-800 text-center leading-tight max-w-[200px] z-20"
        >
          {message || messages[reaction]}
          {/* Speech Bubble Triangle */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-stone-100 rotate-45" />
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

// --- Constants & Helpers ---

const WORD_BANK = { 
  nouns: ["Teacher","River","Dragon","Forest","Robot","Castle","Planet","Library","Wizard","Village","Mountain","Friend","Garden","Ocean","Rainbow","Candy","School","Book"], 
  nonNouns: ["Run","Jump","Quickly","Happy","Blue","Fast","Bright","Slowly","Soft","Fly","Sing","Laugh","Big","Small"] 
};

// --- Verb Practice Data & Logic --- // ← UPDATED 2026
const VERB_ROOTS = [
  { root: "eat", continuous: "eating", yesterday: "ate", hint: "He ate yesterday!" },
  { root: "run", continuous: "running", yesterday: "ran", hint: "He ran yesterday!" },
  { root: "jump", continuous: "jumping", yesterday: "jumped", hint: "He jumped earlier!" },
  { root: "sing", continuous: "singing", yesterday: "sang", hint: "He sang a song!" },
  { root: "fly", continuous: "flying", yesterday: "flew", hint: "He flew high!" }
];

const TIME_CLUES = ["Yesterday", "Now", "Every day"];

const generateVerbRound = (roundIndex: number) => {
  const rootVerb = VERB_ROOTS[roundIndex % VERB_ROOTS.length];
  const timeClue = TIME_CLUES[Math.floor(Math.random() * TIME_CLUES.length)];
  
  let target = "";
  let hint = "";
  
  if (timeClue === "Yesterday") {
    target = rootVerb.yesterday;
    hint = `He ${target} yesterday!`;
  } else if (timeClue === "Now") {
    target = rootVerb.continuous;
    hint = `He is ${target} now!`;
  } else {
    target = rootVerb.root;
    hint = `He likes to ${target} every day!`;
  }

  // Exactly 3 cards: root, continuous, yesterday
  const cards = [rootVerb.root, rootVerb.continuous, rootVerb.yesterday].sort(() => Math.random() - 0.5);

  return {
    root: rootVerb.root,
    timeClue,
    target,
    cards,
    hint
  };
};

// --- Article Practice Data & Logic --- // ← UPDATED 2026
const ARTICLE_CHALLENGES = [
  { item: "apple", image: "https://img.pokemondb.net/sprites/items/apple.png", target: "an", hint: "Apple starts with a vowel sound!" },
  { item: "pokéball", image: "https://img.pokemondb.net/sprites/items/friend-ball.png", target: "a", hint: "Pokéball starts with a consonant sound!" },
  { item: "egg", image: "https://img.pokemondb.net/sprites/items/lucky-egg.png", target: "an", hint: "Egg starts with a vowel sound!" },
  { item: "moon", image: "https://img.pokemondb.net/sprites/items/moon-stone.png", target: "the", hint: "There is only one moon!" },
  { item: "umbrella", image: "https://img.pokemondb.net/sprites/items/red-card.png", target: "an", hint: "Umbrella starts with a vowel sound!" }
];

const ADJECTIVE_CHALLENGES = [
  { 
    id: 1,
    targetOrder: ["beautiful", "large", "old", "round"],
    hint: "Opinion before Size, Age before Shape!",
    noun: "Mirror"
  },
  { 
    id: 2,
    targetOrder: ["small", "new", "red", "Japanese"],
    hint: "Size before Age, Color before Origin!",
    noun: "Dragon"
  },
  { 
    id: 3,
    targetOrder: ["funny", "little", "green", "plastic"],
    hint: "Opinion before Size, Color before Material!",
    noun: "Toy"
  }
];

const generateAdjectiveRound = (roundIndex: number) => {
  const challenge = ADJECTIVE_CHALLENGES[roundIndex % ADJECTIVE_CHALLENGES.length];
  return {
    ...challenge,
    cards: [...challenge.targetOrder].sort(() => Math.random() - 0.5)
  };
};

const LESSON_CHARACTERS: Record<string, { name: string, sprite: string, color: string, emoji: string }> = {
  nouns: { 
    name: "Pikachu", 
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
    color: "#FBD743",
    emoji: "⚡"
  },
  verbs: { 
    name: "Charmander", 
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png",
    color: "#FF9D5C",
    emoji: "🔥"
  },
  articles: { 
    name: "Eevee", 
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png",
    color: "#B88E6F",
    emoji: "🦊"
  },
  prepositions: { 
    name: "Squirtle", 
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png",
    color: "#7CC7DA",
    emoji: "🐢"
  },
  tenses: { 
    name: "Snorlax", 
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png",
    color: "#4A7D8C",
    emoji: "💤"
  },
  adjectives: { 
    name: "Dragonite", 
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png",
    color: "#F7B85D",
    emoji: "🐉"
  },
};

const generateArticleRound = (roundIndex: number) => {
  return ARTICLE_CHALLENGES[roundIndex % ARTICLE_CHALLENGES.length];
};

const CHARACTERS = ["Pikachu","Eevee","Togepi","Snorlax","Dragonite","Bulbasaur","Charmander","Squirtle","Jigglypuff","Meowth"];

const generateSessionWords = () => {
  const selectedNouns = [...WORD_BANK.nouns].sort(() => Math.random() - 0.5).slice(0, 4);
  const selectedNonNouns = [...WORD_BANK.nonNouns].sort(() => Math.random() - 0.5).slice(0, 5);
  
  return [...selectedNouns.map(n => ({ text: n, isNoun: true })), 
          ...selectedNonNouns.map(n => ({ text: n, isNoun: false }))]
          .map((w, i) => ({ ...w, id: i }))
          .sort(() => Math.random() - 0.5);
};

const getRandomCharacter = () => {
  return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
};

const InteractivePractice = ({ lessonId, onComplete, onWatchVideo, onHelp, assets: sharedAssets }: { 
  lessonId: string, 
  onComplete: () => void,
  onWatchVideo?: () => void,
  onHelp?: () => void,
  assets?: any
}) => {
  const [step, setStep] = useState(0);
  const [verbStep, setVerbStep] = useState(0);
  const [articleStep, setArticleStep] = useState(0); // ← UPDATED 2026
  const [adjectiveStep, setAdjectiveStep] = useState(0); // ← UPDATED 2026
  const [currentVerbChallenge, setCurrentVerbChallenge] = useState<any>(null); // ← UPDATED 2026
  const [currentArticleChallenge, setCurrentArticleChallenge] = useState<any>(null); // ← UPDATED 2026
  const [currentAdjectiveChallenge, setCurrentAdjectiveChallenge] = useState<any>(null); // ← UPDATED 2026
  const [verbFeedback, setVerbFeedback] = useState<{ type: 'correct' | 'wrong', card: string } | null>(null);
  const [articleFeedback, setArticleFeedback] = useState<{ type: 'correct' | 'wrong', card: string } | null>(null); // ← UPDATED 2026
  const [adjectiveFeedback, setAdjectiveFeedback] = useState<{ type: 'correct' | 'wrong', message?: string } | null>(null); // ← UPDATED 2026
  const [selectedAdjectives, setSelectedAdjectives] = useState<string[]>([]); // ← UPDATED 2026
  const [sessionWords, setSessionWords] = useState<any[]>([]); // ← UPDATED 2026
  const [character, setCharacter] = useState(""); // ← UPDATED 2026
  const [collectedNouns, setCollectedNouns] = useState<number[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [nounFeedback, setNounFeedback] = useState<{ id: number, type: 'correct' | 'wrong' } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [currentPreposition, setCurrentPreposition] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mascotReaction, setMascotReaction] = useState<'happy' | 'thinking' | 'sad' | 'excited' | 'confused'>('happy');
  const [chestState, setChestState] = useState<'closed' | 'open' | 'half-closed'>('closed'); // ← UPDATED 2026
  const [mirrorState, setMirrorState] = useState<'blank' | 'glow' | 'cracked'>('blank'); // ← UPDATED 2026
  const [itemFlying, setItemFlying] = useState(false); // ← UPDATED 2026
  const containerRef = React.useRef<HTMLDivElement>(null);
  const bagRef = React.useRef<HTMLDivElement>(null);
  const characterRef = React.useRef<HTMLDivElement>(null);
  const chestRef = React.useRef<HTMLDivElement>(null); // ← UPDATED 2026
  const mirrorRef = React.useRef<HTMLDivElement>(null); // ← UPDATED 2026
  const { assets: localAssets, loading, error, generate } = useAssets();
  
  const assets = sharedAssets || localAssets;

  // ← UPDATED 2026: Full session reset with character and word randomization
  React.useEffect(() => {
    if (lessonId === 'verbs') {
      setVerbStep(0);
      setCurrentVerbChallenge(generateVerbRound(0));
    } else if (lessonId === 'articles') {
      setArticleStep(0);
      setCurrentArticleChallenge(generateArticleRound(0));
      setChestState('closed');
      setItemFlying(false);
    } else if (lessonId === 'adjectives') {
      setAdjectiveStep(0);
      setCurrentAdjectiveChallenge(generateAdjectiveRound(0));
      setSelectedAdjectives([]);
      setMirrorState('blank');
    } else {
      setSessionWords(generateSessionWords());
      setCharacter(getRandomCharacter());
      setCollectedNouns([]);
    }
    setIsDone(false);
    setVerbFeedback(null);
    setArticleFeedback(null);
    setAdjectiveFeedback(null);
  }, [lessonId]);

  // Helper: Check if two rectangles overlap by at least 30%
  const checkOverlap = (cardRect: DOMRect, bagRect: DOMRect) => {
    const padding = 15; // Forgiving hitbox
    const threshold = 0.3; // 30% overlap

    const paddedBag = {
      left: bagRect.left - padding,
      right: bagRect.right + padding,
      top: bagRect.top - padding,
      bottom: bagRect.bottom + padding,
    };

    const xOverlap = Math.max(0, Math.min(cardRect.right, paddedBag.right) - Math.max(cardRect.left, paddedBag.left));
    const yOverlap = Math.max(0, Math.min(cardRect.bottom, paddedBag.bottom) - Math.max(cardRect.top, paddedBag.top));
    const overlapArea = xOverlap * yOverlap;
    const cardArea = cardRect.width * cardRect.height;
    
    return overlapArea / cardArea >= threshold;
  };

  const handleNounDragEnd = (event: any, info: any, word: any) => {
    if (!bagRef.current) return;
    
    const bagRect = bagRef.current.getBoundingClientRect();
    const cardRect = (event.target as HTMLElement).getBoundingClientRect();

    const isOverBag = checkOverlap(cardRect, bagRect);

    if (isOverBag) {
      if (word.isNoun) {
        if (!collectedNouns.includes(word.id)) {
          const newCollected = [...collectedNouns, word.id];
          setCollectedNouns(newCollected);
          setNounFeedback({ id: word.id, type: 'correct' });
          
          if (newCollected.length >= 4) {
            setTimeout(() => setIsDone(true), 1200);
          }
        }
      } else {
        setNounFeedback({ id: word.id, type: 'wrong' });
      }
    }
    
    setTimeout(() => setNounFeedback(null), 1000);
  };

  const handleVerbDragEnd = (event: any, info: any, card: string) => {
    if (!characterRef.current || !currentVerbChallenge) return;
    
    const charRect = characterRef.current.getBoundingClientRect();
    const cardRect = (event.target as HTMLElement).getBoundingClientRect();

    const isOverChar = checkOverlap(cardRect, charRect);

    if (isOverChar) {
      if (card === currentVerbChallenge.target) {
        setVerbFeedback({ type: 'correct', card });
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        
        setTimeout(() => {
          if (verbStep < 4) { // 5 rounds total
            const nextStep = verbStep + 1;
            setVerbStep(nextStep);
            setCurrentVerbChallenge(generateVerbRound(nextStep));
            setVerbFeedback(null);
          } else {
            setIsDone(true);
          }
        }, 2000);
      } else {
        setVerbFeedback({ type: 'wrong', card });
        setTimeout(() => setVerbFeedback(null), 2500);
      }
    }
  };

  const handleArticleDragEnd = (event: any, info: any, card: string) => {
    if (!chestRef.current || !currentArticleChallenge) return;
    
    const chestRect = chestRef.current.getBoundingClientRect();
    const cardRect = (event.target as HTMLElement).getBoundingClientRect();

    const isOverChest = checkOverlap(cardRect, chestRect);

    if (isOverChest) {
      if (card === currentArticleChallenge.target) {
        setArticleFeedback({ type: 'correct', card });
        setChestState('open');
        setItemFlying(true);
        confetti({ 
          particleCount: 150, 
          spread: 100, 
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FFFFFF'] // Golden sparkles
        });
        
        setTimeout(() => {
          if (articleStep < 4) { // 5 rounds total
            const nextStep = articleStep + 1;
            setArticleStep(nextStep);
            setCurrentArticleChallenge(generateArticleRound(nextStep));
            setArticleFeedback(null);
            setChestState('closed');
            setItemFlying(false);
          } else {
            setIsDone(true);
          }
        }, 3000);
      } else {
        setArticleFeedback({ type: 'wrong', card });
        setChestState('half-closed');
        setTimeout(() => {
          setArticleFeedback(null);
          setChestState('closed');
        }, 2500);
      }
    }
  };

  const handleAdjectiveDrop = (event: any, info: any, card: string) => {
    if (!mirrorRef.current || !currentAdjectiveChallenge) return;
    
    const mirrorRect = mirrorRef.current.getBoundingClientRect();
    const cardRect = (event.target as HTMLElement).getBoundingClientRect();

    const isOverMirror = checkOverlap(cardRect, mirrorRect);

    if (isOverMirror) {
      if (selectedAdjectives.includes(card)) return;

      const newSelected = [...selectedAdjectives, card];
      setSelectedAdjectives(newSelected);

      // Check if the order is correct so far
      const isCorrectSoFar = newSelected.every((val, index) => val === currentAdjectiveChallenge.targetOrder[index]);

      if (!isCorrectSoFar) {
        setAdjectiveFeedback({ type: 'wrong', message: currentAdjectiveChallenge.hint });
        setMirrorState('cracked');
        setTimeout(() => {
          setSelectedAdjectives([]);
          setAdjectiveFeedback(null);
          setMirrorState('blank');
        }, 2000);
      } else if (newSelected.length === currentAdjectiveChallenge.targetOrder.length) {
        // All correct!
        setAdjectiveFeedback({ type: 'correct', message: "Order matters!" });
        setMirrorState('glow');
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
        
        setTimeout(() => {
          if (adjectiveStep < 2) { // 3 rounds total
            const nextStep = adjectiveStep + 1;
            setAdjectiveStep(nextStep);
            setCurrentAdjectiveChallenge(generateAdjectiveRound(nextStep));
            setSelectedAdjectives([]);
            setAdjectiveFeedback(null);
            setMirrorState('blank');
          } else {
            setIsDone(true);
          }
        }, 3500);
      }
    }
  };

  // Initial asset generation for prepositions
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

  const leaderboard = [
    { name: "Ardra A S", xp: 980, rank: 1 },
    { name: "Devika Chandan D", xp: 945, rank: 2 },
    { name: "Samyukta Sanil", xp: 920, rank: 3 },
    { name: "Aksa Susan Abraham", xp: 890, rank: 4 }
  ];

  if (lessonId === 'verbs') {
    if (!currentVerbChallenge) return null;
    const lessonChar = LESSON_CHARACTERS.verbs;
    
    return (
      <div className="max-w-4xl w-full flex flex-col items-center relative">
        <div className="text-center mb-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Let's Practice</p>
          <h2 className="text-5xl font-serif italic mb-6">Mastering Verbs</h2>
          
          {/* Character Area - Charmander Exclusively for Verbs */}
          <div className="flex justify-center mb-8">
            <motion.div 
              ref={characterRef}
              animate={verbFeedback?.type === 'correct' ? { 
                scale: [1, 1.15, 1],
                y: [0, -20, 0],
                ...(verbFeedback.card.includes('run') || verbFeedback.card.includes('running') || verbFeedback.card.includes('ran') ? { 
                  x: [-40, 40, -40, 40, 0],
                  skewX: [-10, 10, -10, 10, 0]
                } : {}),
                ...(verbFeedback.card.includes('jump') || verbFeedback.card.includes('jumping') || verbFeedback.card.includes('jumped') ? { 
                  y: [0, -100, 0, -60, 0],
                  scaleY: [1, 0.8, 1.2, 1]
                } : {}),
                ...(verbFeedback.card.includes('eat') || verbFeedback.card.includes('eating') || verbFeedback.card.includes('ate') ? { 
                  scale: [1, 1.3, 0.9, 1.2, 1],
                  rotate: [0, 5, -5, 5, 0]
                } : {}),
                ...(verbFeedback.card.includes('sing') ? { rotate: [0, -15, 15, -15, 15, 0] } : {}),
                ...(verbFeedback.card.includes('fly') ? { y: [0, -120, 0], scale: [1, 0.9, 1.1, 1] } : {})
              } : verbFeedback?.type === 'wrong' ? {
                x: [0, -5, 5, -5, 5, 0]
              } : {}}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="relative w-64 h-64 flex items-center justify-center"
            >
              <img 
                src={lessonChar.sprite} 
                alt={lessonChar.name} 
                className={`w-full h-full object-contain transition-all ${verbFeedback?.type === 'wrong' ? 'grayscale brightness-50' : ''}`}
                referrerPolicy="no-referrer"
              />
              
              {/* Beaming Reaction Overlays - Signature Wise Beaming Reaction */}
              {verbFeedback?.type === 'correct' && (
                <div className="absolute inset-0 pointer-events-none">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Curved Eyes */}
                    <path d="M35,40 Q40,35 45,40" fill="none" stroke="#333" strokeWidth="4" strokeLinecap="round" />
                    <path d="M55,40 Q60,35 65,40" fill="none" stroke="#333" strokeWidth="4" strokeLinecap="round" />
                    {/* Pink Cheek Glow */}
                    <circle cx="25" cy="55" r="8" fill="#FFB6C1" opacity="0.8" />
                    <circle cx="75" cy="55" r="8" fill="#FFB6C1" opacity="0.8" />
                  </svg>
                </div>
              )}

              {/* Speech Bubbles */}
              <AnimatePresence>
                {verbFeedback?.type === 'correct' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: -40 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute -top-20 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-2xl shadow-2xl border-2 border-pikachu text-teal-900 font-black z-50 min-w-[250px] text-center"
                  >
                    Perfect subject-verb agreement!
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-2 border-b-2 border-pikachu rotate-45" />
                  </motion.div>
                )}
                {verbFeedback?.type === 'wrong' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: -60 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute -top-24 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-2xl shadow-2xl border-2 border-rose-400 text-rose-600 font-black z-50 min-w-[200px] text-center"
                  >
                    Subject doesn't match!
                    <div className="text-sm mt-1 opacity-80 font-bold">Hint: {currentVerbChallenge.hint}</div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-2 border-b-2 border-rose-400 rotate-45" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Trainer Pop-in - Ash pops to screen on correct answer */}
              <AnimatePresence>
                {verbFeedback?.type === 'correct' && (
                  <motion.div
                    initial={{ x: 100, opacity: 0, scale: 0.5 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    exit={{ x: 100, opacity: 0 }}
                    className="absolute -right-32 bottom-0 w-48 h-48 z-40"
                  >
                    <img 
                      src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/1.png" 
                      alt="Ash" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Star Burst */}
              <AnimatePresence>
                {verbFeedback?.type === 'correct' && (
                  <motion.div
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: 1, y: -120 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-0 text-amber-500 font-black text-5xl z-50 drop-shadow-lg"
                  >
                    +10 ⭐
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          <p className="text-2xl text-ink font-bold">
            “Drag the correct verb form onto Charmander!”
          </p>
        </div>

        <div className="relative w-full min-h-[400px] flex flex-col items-center justify-center">
          {!isDone && (
            <>
              {/* Time Clue */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                key={currentVerbChallenge.timeClue}
                className="mb-8"
              >
                <span className="px-10 py-4 bg-amber-100 text-amber-800 rounded-full font-black text-3xl shadow-sm border-2 border-amber-200">
                  {currentVerbChallenge.timeClue}
                </span>
              </motion.div>

              <div className="flex flex-wrap justify-center gap-6 mt-8">
                {currentVerbChallenge.cards.map((card: string) => (
                  <motion.div
                    key={card}
                    drag
                    dragSnapToOrigin
                    onDragEnd={(e, info) => handleVerbDragEnd(e, info, card)}
                    whileHover={{ scale: 1.05 }}
                    whileDrag={{ scale: 1.1, zIndex: 50 }}
                    className={`px-8 py-5 bg-white rounded-2xl shadow-xl border-2 cursor-grab active:cursor-grabbing font-black text-xl transition-all select-none ${
                      verbFeedback?.card === card && verbFeedback.type === 'wrong' 
                        ? 'border-rose-500 bg-rose-50 text-rose-600' 
                        : verbFeedback?.card === card && verbFeedback.type === 'correct'
                        ? 'border-pikachu bg-amber-50 text-amber-700 shadow-[0_0_20px_rgba(251,215,67,0.4)]'
                        : 'border-stone-100 text-ink'
                    }`}
                    style={{ touchAction: 'none' }}
                  >
                    {card}
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {/* Post-Practice Options */}
          <AnimatePresence>
            {isDone && (
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-3xl space-y-8"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <button 
                    onClick={onWatchVideo}
                    className="p-8 bg-white rounded-[40px] shadow-xl border border-stone-50 hover:border-blue-200 transition-all group text-left btn-plushy"
                  >
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                      <Play size={28} className="text-blue-600" />
                    </div>
                    <h3 className="text-xl font-serif italic mb-1">Watch Videos</h3>
                    <p className="text-xs text-muted font-medium">Visual review.</p>
                  </button>

                  <div className="p-8 bg-green-50 rounded-[40px] shadow-xl border border-green-100 text-left relative overflow-hidden">
                    <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                      <CheckCircle2 size={28} className="text-green-600" />
                    </div>
                    <h3 className="text-xl font-serif italic mb-1">Practice</h3>
                    <p className="text-xs text-green-700 font-bold">Already Done!</p>
                    <div className="absolute -right-4 -bottom-4 opacity-10">
                      <CheckCircle2 size={100} />
                    </div>
                  </div>

                  <button 
                    onClick={onHelp}
                    className="p-8 bg-white rounded-[40px] shadow-xl border border-stone-50 hover:border-teal-200 transition-all group text-left btn-plushy"
                  >
                    <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-teal-100 transition-colors">
                      <Leaf size={28} className="text-teal-600" />
                    </div>
                    <h3 className="text-xl font-serif italic mb-1">Help</h3>
                    <p className="text-xs text-muted font-medium">Ask Sensei.</p>
                  </button>
                </div>

                <button 
                  onClick={onComplete}
                  className="w-full py-6 bg-ink text-white font-bold rounded-3xl hover:bg-stone-800 transition-all flex items-center justify-center gap-3 shadow-2xl btn-plushy group"
                >
                  <span className="text-2xl">Quiz time</span>
                  <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (lessonId === 'adjectives') {
    if (!currentAdjectiveChallenge) return null;
    const lessonChar = LESSON_CHARACTERS.adjectives;
    
    return (
      <div className="max-w-4xl w-full flex flex-col items-center relative">
        <div className="text-center mb-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Let's Practice</p>
          <h2 className="text-5xl font-serif italic mb-4">Mastering Adjectives</h2>
          
          {/* Character - Dragonite Exclusive for Adjectives */}
          <div className="flex justify-center mb-6">
            <motion.div
              animate={adjectiveFeedback?.type === 'correct' ? {
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0],
                y: [0, -20, 0]
              } : {}}
              className="relative w-48 h-48"
            >
              <img 
                src={lessonChar.sprite} 
                alt={lessonChar.name} 
                className={`w-full h-full object-contain drop-shadow-2xl transition-all ${adjectiveFeedback?.type === 'wrong' ? 'grayscale' : ''}`}
                referrerPolicy="no-referrer"
              />
              
              {/* Beaming Reaction Overlays */}
              {adjectiveFeedback?.type === 'correct' && (
                <div className="absolute inset-0 pointer-events-none">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <path d="M35,40 Q40,35 45,40" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round" />
                    <path d="M55,40 Q60,35 65,40" fill="none" stroke="#333" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="25" cy="55" r="6" fill="#FFB6C1" opacity="0.8" />
                    <circle cx="75" cy="55" r="6" fill="#FFB6C1" opacity="0.8" />
                  </svg>
                </div>
              )}

              <AnimatePresence>
                {adjectiveFeedback && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: -40 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`absolute -top-16 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-2xl shadow-2xl border-2 font-black z-50 min-w-[250px] text-center ${
                      adjectiveFeedback.type === 'correct' ? 'border-pikachu text-teal-900' : 'border-rose-400 text-rose-600'
                    }`}
                  >
                    {adjectiveFeedback.message}
                    <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-2 border-b-2 rotate-45 ${
                      adjectiveFeedback.type === 'correct' ? 'border-pikachu' : 'border-rose-400'
                    }`} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          <p className="text-2xl text-ink font-bold">
            “Drag the adjectives in the correct order!”
          </p>
        </div>

        <div className="relative w-full min-h-[500px] flex flex-col items-center justify-center">
          {!isDone && (
            <>
              {/* Magic Mirror & Selected Adjectives */}
              <div className="relative mb-12 flex flex-col items-center">
                <div className="mb-8 flex gap-3 h-16 items-center justify-center">
                  {currentAdjectiveChallenge.targetOrder.map((_, idx) => (
                    <div 
                      key={idx}
                      className={`w-32 h-14 rounded-xl border-2 border-dashed flex items-center justify-center transition-all ${
                        selectedAdjectives[idx] ? 'border-primary bg-primary/5' : 'border-stone-200'
                      }`}
                    >
                      {selectedAdjectives[idx] && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="font-black text-primary"
                        >
                          {selectedAdjectives[idx]}
                        </motion.span>
                      )}
                    </div>
                  ))}
                  <span className="text-2xl font-black text-ink ml-2">{currentAdjectiveChallenge.noun}</span>
                </div>

                <motion.div 
                  ref={mirrorRef}
                  animate={mirrorState === 'glow' ? { 
                    scale: [1, 1.05, 1],
                    boxShadow: ["0 0 0px rgba(251,215,67,0)", "0 0 40px rgba(251,215,67,0.6)", "0 0 0px rgba(251,215,67,0)"]
                  } : mirrorState === 'cracked' ? {
                    x: [0, -5, 5, -5, 5, 0]
                  } : {}}
                  className="relative w-64 h-80 bg-stone-100 rounded-t-full border-8 border-stone-300 shadow-inner overflow-hidden"
                >
                  {/* Mirror Surface */}
                  <div className={`absolute inset-0 transition-colors duration-500 ${
                    mirrorState === 'glow' ? 'bg-amber-100' : 'bg-stone-200'
                  }`}>
                    {/* Reflection / Silhouette */}
                    <AnimatePresence mode="wait">
                      {mirrorState === 'glow' ? (
                        <motion.img
                          key="dragonite"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 0.8 }}
                          src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png"
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <motion.div
                          key="silhouette"
                          className="w-full h-full flex items-center justify-center opacity-20"
                        >
                          <div className="w-40 h-40 bg-stone-400 rounded-full blur-xl" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Crack Overlay */}
                    {mirrorState === 'cracked' && (
                      <div className="absolute inset-0 pointer-events-none">
                        <svg viewBox="0 0 100 100" className="w-full h-full stroke-stone-400 stroke-[0.5] fill-none">
                          <path d="M50,0 L45,30 L55,50 L40,80 L50,100" />
                          <path d="M0,50 L30,45 L60,55 L100,40" />
                        </svg>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Draggable Adjective Cards */}
              <div className="flex flex-wrap justify-center gap-4 max-w-2xl">
                {currentAdjectiveChallenge.cards.map((card: string) => (
                  <motion.div
                    key={card}
                    drag
                    dragSnapToOrigin
                    onDragEnd={(e, info) => handleAdjectiveDrop(e, info, card)}
                    whileHover={{ scale: 1.05 }}
                    whileDrag={{ scale: 1.1, zIndex: 50 }}
                    className={`px-8 py-4 bg-white rounded-2xl shadow-xl border-2 cursor-grab active:cursor-grabbing font-black text-lg transition-all select-none ${
                      selectedAdjectives.includes(card) ? 'opacity-30 pointer-events-none' : 'border-stone-100 text-ink'
                    }`}
                    style={{ touchAction: 'none' }}
                  >
                    {card}
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {/* Post-Practice Options */}
          <AnimatePresence>
            {isDone && (
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-3xl space-y-8"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <button 
                    onClick={onWatchVideo}
                    className="p-8 bg-white rounded-[40px] shadow-xl border border-stone-50 hover:border-blue-200 transition-all group text-left btn-plushy"
                  >
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                      <Play size={28} className="text-blue-600" />
                    </div>
                    <h3 className="text-xl font-serif italic mb-1">Watch Videos</h3>
                    <p className="text-xs text-muted font-medium">Visual review.</p>
                  </button>

                  <div className="p-8 bg-green-50 rounded-[40px] shadow-xl border border-green-100 text-left relative overflow-hidden">
                    <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                      <CheckCircle2 size={28} className="text-green-600" />
                    </div>
                    <h3 className="text-xl font-serif italic mb-1">Practice</h3>
                    <p className="text-xs text-green-700 font-bold">Already Done!</p>
                    <div className="absolute -right-4 -bottom-4 opacity-10">
                      <CheckCircle2 size={100} />
                    </div>
                  </div>

                  <button 
                    onClick={onHelp}
                    className="p-8 bg-white rounded-[40px] shadow-xl border border-stone-50 hover:border-teal-200 transition-all group text-left btn-plushy"
                  >
                    <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-teal-100 transition-colors">
                      <Leaf size={28} className="text-teal-600" />
                    </div>
                    <h3 className="text-xl font-serif italic mb-1">Help</h3>
                    <p className="text-xs text-muted font-medium">Ask Sensei.</p>
                  </button>
                </div>

                <button 
                  onClick={onComplete}
                  className="w-full py-6 bg-ink text-white font-bold rounded-3xl hover:bg-stone-800 transition-all flex items-center justify-center gap-3 shadow-2xl btn-plushy group"
                >
                  <span className="text-2xl">Quiz time</span>
                  <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (lessonId === 'articles') {
    if (!currentArticleChallenge) return null;
    const lessonChar = LESSON_CHARACTERS.articles;
    
    return (
      <div className="max-w-4xl w-full flex flex-col items-center relative">
        <div className="text-center mb-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Interactive Practice</p>
          <h2 className="text-5xl font-serif italic mb-6">Mastering Articles</h2>

          {/* Eevee - Centered in the blank space */}
          <div className="flex justify-center mb-8">
            <motion.div
              ref={characterRef}
              animate={articleFeedback?.type === 'correct' ? { 
                scale: [1, 1.15, 1],
                y: [0, -20, 0],
                rotate: [0, 10, -10, 10, 0]
              } : articleFeedback?.type === 'wrong' ? {
                x: [0, -5, 5, -5, 5, 0]
              } : {}}
              className="relative w-64 h-64 flex items-center justify-center"
            >
              <img 
                src={lessonChar.sprite} 
                alt={lessonChar.name} 
                className={`w-full h-full object-contain transition-all ${articleFeedback?.type === 'wrong' ? 'grayscale brightness-50' : ''}`}
                referrerPolicy="no-referrer"
              />
              
              {/* Beaming Reaction Overlays */}
              {articleFeedback?.type === 'correct' && (
                <div className="absolute inset-0 pointer-events-none">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <path d="M35,40 Q40,35 45,40" fill="none" stroke="#333" strokeWidth="4" strokeLinecap="round" />
                    <path d="M55,40 Q60,35 65,40" fill="none" stroke="#333" strokeWidth="4" strokeLinecap="round" />
                    <circle cx="25" cy="55" r="8" fill="#FFB6C1" opacity="0.8" />
                    <circle cx="75" cy="55" r="8" fill="#FFB6C1" opacity="0.8" />
                  </svg>
                </div>
              )}

              {/* Speech Bubbles */}
              <AnimatePresence>
                {articleFeedback?.type === 'correct' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: -40 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute -top-20 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-2xl shadow-2xl border-2 border-pikachu text-teal-900 font-black z-50 min-w-[250px] text-center"
                  >
                    A or An depends on the first sound!
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-2 border-b-2 border-pikachu rotate-45" />
                  </motion.div>
                )}
                {articleFeedback?.type === 'wrong' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: -40 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute -top-20 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-2xl shadow-2xl border-2 border-rose-400 text-rose-600 font-black z-50 min-w-[200px] text-center"
                  >
                    Listen to the starting sound!
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-2 border-b-2 border-rose-400 rotate-45" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Star Burst */}
              <AnimatePresence>
                {articleFeedback?.type === 'correct' && (
                  <motion.div
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: 1, y: -120 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-0 text-amber-500 font-black text-5xl z-50 drop-shadow-lg"
                  >
                    +10 ⭐
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          <p className="text-2xl text-ink font-bold">
            “Drag the correct article into the treasure chest!”
          </p>
        </div>

        <div className="relative w-full min-h-[500px] flex flex-col items-center justify-center">
          {!isDone && (
            <>
              {/* Treasure Chest & Item */}
              <div className="relative mb-12 flex flex-col items-center">
                <div className="h-32 flex items-center justify-center mb-4">
                  <AnimatePresence>
                    {itemFlying && (
                      <motion.div
                        initial={{ scale: 0, y: 50, opacity: 0 }}
                        animate={{ scale: 1.5, y: -50, opacity: 1, rotate: 360 }}
                        className="relative z-30"
                      >
                        <div className="absolute inset-0 bg-amber-400 blur-2xl opacity-50 animate-pulse rounded-full" />
                        <img 
                          src={currentArticleChallenge.image} 
                          alt={currentArticleChallenge.item} 
                          className="w-24 h-24 object-contain relative z-10"
                          referrerPolicy="no-referrer"
                        />
                      </motion.div>
                    )}
                    {!itemFlying && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center"
                      >
                        <p className="text-4xl font-black text-ink mb-2">I see ___ <span className="text-primary uppercase">{currentArticleChallenge.item}</span></p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.div 
                  ref={chestRef}
                  animate={chestState === 'open' ? { 
                    scale: [1, 1.1, 1],
                    rotate: [0, -2, 2, 0]
                  } : chestState === 'half-closed' ? {
                    scale: [1, 0.95, 1],
                    y: [0, 5, 0]
                  } : {}}
                  className="relative w-64 h-48"
                >
                  <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-2xl">
                    <rect x="10" y="30" width="80" height="40" rx="4" fill="#5D4037" />
                    <rect x="15" y="35" width="70" height="30" rx="2" fill="#795548" />
                    <motion.g
                      animate={chestState === 'open' ? { rotateX: -110, y: -10 } : chestState === 'half-closed' ? { rotateX: -20 } : { rotateX: 0 }}
                      style={{ originY: '30px', transformStyle: 'preserve-3d' }}
                    >
                      <path d="M10,30 Q10,10 50,10 Q90,10 90,30 Z" fill="#5D4037" />
                      <path d="M15,30 Q15,15 50,15 Q85,15 85,30 Z" fill="#795548" />
                      <rect x="45" y="25" width="10" height="10" rx="2" fill="#FFD700" />
                      <circle cx="50" cy="30" r="2" fill="#333" />
                    </motion.g>
                    {chestState === 'open' && (
                      <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <circle cx="30" cy="20" r="2" fill="#FFD700" />
                        <circle cx="70" cy="15" r="1.5" fill="#FFD700" />
                        <circle cx="50" cy="5" r="2.5" fill="#FFD700" />
                      </motion.g>
                    )}
                  </svg>
                </motion.div>
              </div>

              {/* Draggable Cards */}
              <div className="flex justify-center gap-6">
                {["a", "an", "the"].map((card) => (
                  <motion.div
                    key={card}
                    drag
                    dragSnapToOrigin
                    onDragEnd={(e, info) => handleArticleDragEnd(e, info, card)}
                    whileHover={{ scale: 1.1 }}
                    whileDrag={{ scale: 1.2, zIndex: 50 }}
                    className={`px-14 py-8 bg-white rounded-[32px] shadow-2xl border-4 cursor-grab active:cursor-grabbing font-black text-5xl transition-all select-none ${
                      articleFeedback?.card === card && articleFeedback.type === 'wrong' 
                        ? 'border-rose-500 bg-rose-50 text-rose-600' 
                        : articleFeedback?.card === card && articleFeedback.type === 'correct'
                        ? 'border-pikachu bg-amber-50 text-amber-700'
                        : 'border-stone-100 text-ink'
                    }`}
                    style={{ touchAction: 'none' }}
                  >
                    {card}
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {/* Post-Practice Options */}
          <AnimatePresence>
            {isDone && (
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-3xl space-y-8"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <button 
                    onClick={onWatchVideo}
                    className="p-8 bg-white rounded-[40px] shadow-xl border border-stone-50 hover:border-blue-200 transition-all group text-left btn-plushy"
                  >
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                      <Play size={28} className="text-blue-600" />
                    </div>
                    <h3 className="text-xl font-serif italic mb-1">Watch Videos</h3>
                    <p className="text-xs text-muted font-medium">Visual review.</p>
                  </button>

                  <div className="p-8 bg-green-50 rounded-[40px] shadow-xl border border-green-100 text-left relative overflow-hidden">
                    <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                      <CheckCircle2 size={28} className="text-green-600" />
                    </div>
                    <h3 className="text-xl font-serif italic mb-1">Practice</h3>
                    <p className="text-xs text-green-700 font-bold">Already Done!</p>
                    <div className="absolute -right-4 -bottom-4 opacity-10">
                      <CheckCircle2 size={100} />
                    </div>
                  </div>

                  <button 
                    onClick={onHelp}
                    className="p-8 bg-white rounded-[40px] shadow-xl border border-stone-50 hover:border-teal-200 transition-all group text-left btn-plushy"
                  >
                    <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-teal-100 transition-colors">
                      <Leaf size={28} className="text-teal-600" />
                    </div>
                    <h3 className="text-xl font-serif italic mb-1">Help</h3>
                    <p className="text-xs text-muted font-medium">Ask Sensei.</p>
                  </button>
                </div>

                <button 
                  onClick={onComplete}
                  className="w-full py-6 bg-ink text-white font-bold rounded-3xl hover:bg-stone-800 transition-all flex items-center justify-center gap-3 shadow-2xl btn-plushy group"
                >
                  <span className="text-2xl">Quiz time</span>
                  <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (lessonId === 'nouns') {
    const lessonChar = LESSON_CHARACTERS.nouns;
    
    return (
      <div className="max-w-4xl w-full flex flex-col items-center relative">
        <div className="text-center mb-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Interactive Practice</p>
          <h2 className="text-5xl font-serif italic mb-6">Mastering Nouns</h2>
          
          {/* Character Area - Pikachu Exclusively for Nouns */}
          <div className="flex justify-center mb-8">
            <motion.div 
              ref={characterRef}
              animate={nounFeedback?.type === 'correct' ? { 
                scale: [1, 1.15, 1],
                y: [0, -20, 0],
                rotate: [0, 5, -5, 5, -5, 0]
              } : nounFeedback?.type === 'wrong' ? {
                x: [0, -5, 5, -5, 5, 0]
              } : {}}
              className="relative w-64 h-64 flex items-center justify-center"
            >
              <img 
                src={lessonChar.sprite} 
                alt={lessonChar.name} 
                className={`w-full h-full object-contain transition-all ${nounFeedback?.type === 'wrong' ? 'grayscale brightness-50' : ''}`}
                referrerPolicy="no-referrer"
              />
              
              {/* Beaming Reaction Overlays */}
              {nounFeedback?.type === 'correct' && (
                <div className="absolute inset-0 pointer-events-none">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <path d="M35,40 Q40,35 45,40" fill="none" stroke="#333" strokeWidth="4" strokeLinecap="round" />
                    <path d="M55,40 Q60,35 65,40" fill="none" stroke="#333" strokeWidth="4" strokeLinecap="round" />
                    <circle cx="25" cy="55" r="8" fill="#FFB6C1" opacity="0.8" />
                    <circle cx="75" cy="55" r="8" fill="#FFB6C1" opacity="0.8" />
                  </svg>
                </div>
              )}

              {/* Speech Bubbles */}
              <AnimatePresence>
                {nounFeedback?.type === 'correct' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: -40 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-2xl shadow-xl border-2 border-pikachu text-lg font-black text-teal-900 z-50"
                  >
                    Yay!
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-2 border-b-2 border-pikachu rotate-45" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Star Burst */}
              <AnimatePresence>
                {nounFeedback?.type === 'correct' && (
                  <motion.div
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: 1, y: -120 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-0 text-amber-500 font-black text-5xl z-50 drop-shadow-lg"
                  >
                    +10 ⭐
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          <p className="text-2xl text-ink font-bold">
            “Drag the nouns into {lessonChar.name}'s bag!”
          </p>
        </div>
        
        <div className="relative w-full min-h-[500px] flex flex-col items-center justify-center">
          {/* The Bag */}
          <motion.div 
            ref={bagRef}
            animate={{ 
              scale: nounFeedback?.type === 'correct' ? [1, 1.15, 1] : 1,
              rotate: nounFeedback?.type === 'correct' ? [0, 5, -5, 5, -5, 0] : 0
            }}
            transition={{ duration: 0.3 }}
            className="relative z-10 mb-12"
          >
            <div className="relative w-56 h-56">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
                <path 
                  d="M25,45 Q25,25 50,25 Q75,25 75,45 L80,80 Q80,95 50,95 Q20,95 20,80 Z" 
                  fill="#FBD743" 
                  fillOpacity="0.9"
                  stroke="#C89B6D" 
                  strokeWidth="1.5"
                />
                <circle cx="42" cy="65" r="2" fill="#333" opacity="0.4" />
                <circle cx="58" cy="65" r="2" fill="#333" opacity="0.4" />
                <path d="M46,75 Q50,77 54,75" fill="none" stroke="#333" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
              </svg>
              
              <div className="absolute -top-4 -right-4 bg-[#FFCC70] w-14 h-14 rounded-full shadow-lg flex items-center justify-center border-4 border-white font-black text-teal-900">
                {collectedNouns.length}/4
              </div>
            </div>
          </motion.div>

          {/* Draggable Words */}
          {!isDone && (
            <div className="flex flex-wrap justify-center gap-4 max-w-2xl">
              {sessionWords.filter(word => !collectedNouns.includes(word.id)).map((word) => (
                <motion.div
                  key={word.id}
                  drag
                  dragSnapToOrigin
                  onDragEnd={(e, info) => handleNounDragEnd(e, info, word)}
                  whileHover={{ scale: 1.05 }}
                  whileDrag={{ 
                    scale: 1.08, 
                    zIndex: 50,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
                  }}
                  animate={nounFeedback?.id === word.id && nounFeedback.type === 'wrong' ? {
                    x: [0, -10, 10, -10, 10, 0],
                    transition: { duration: 0.4 }
                  } : {}}
                  className={`px-6 py-4 bg-white rounded-2xl shadow-md border-2 cursor-grab active:cursor-grabbing font-bold text-lg transition-colors select-none ${
                    nounFeedback?.id === word.id && nounFeedback.type === 'wrong' 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-stone-100'
                  }`}
                  style={{ touchAction: 'none' }}
                >
                  {word.text}
                </motion.div>
              ))}
            </div>
          )}

          {/* Post-Practice Options */}
          <AnimatePresence>
            {isDone && (
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-3xl space-y-8"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <button 
                    onClick={onWatchVideo}
                    className="p-8 bg-white rounded-[40px] shadow-xl border border-stone-50 hover:border-blue-200 transition-all group text-left btn-plushy"
                  >
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                      <Play size={28} className="text-blue-600" />
                    </div>
                    <h3 className="text-xl font-serif italic mb-1">Watch Videos</h3>
                    <p className="text-xs text-muted font-medium">Visual review.</p>
                  </button>

                  <div className="p-8 bg-green-50 rounded-[40px] shadow-xl border border-green-100 text-left relative overflow-hidden">
                    <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                      <CheckCircle2 size={28} className="text-green-600" />
                    </div>
                    <h3 className="text-xl font-serif italic mb-1">Practice</h3>
                    <p className="text-xs text-green-700 font-bold">Already Done!</p>
                    <div className="absolute -right-4 -bottom-4 opacity-10">
                      <CheckCircle2 size={100} />
                    </div>
                  </div>

                  <button 
                    onClick={onHelp}
                    className="p-8 bg-white rounded-[40px] shadow-xl border border-stone-50 hover:border-teal-200 transition-all group text-left btn-plushy"
                  >
                    <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-teal-100 transition-colors">
                      <Leaf size={28} className="text-teal-600" />
                    </div>
                    <h3 className="text-xl font-serif italic mb-1">Help</h3>
                    <p className="text-xs text-muted font-medium">Ask Sensei.</p>
                  </button>
                </div>

                <button 
                  onClick={onComplete}
                  className="w-full py-6 bg-ink text-white font-bold rounded-3xl hover:bg-stone-800 transition-all flex items-center justify-center gap-3 shadow-2xl btn-plushy group"
                >
                  <span className="text-2xl">Quiz time</span>
                  <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
    
    const scaleX = 800 / containerRect.width;
    const scaleY = 450 / containerRect.height;
    const dropX = (point.x - containerRect.left) * scaleX;
    const dropY = (point.y - containerRect.top) * scaleY;
    
    const isInWater = (Math.pow(dropX - 450, 2) / Math.pow(220, 2)) + 
                      (Math.pow(dropY - 306, 2) / Math.pow(54, 2)) <= 1;
    
    const isUnderBench = dropX > 600 && dropX < 780 && dropY > 342 && dropY < 432;
    const isOnDeck = dropY > 288 && !isUnderBench;

    let prep = "none";
    if (isUnderBench) prep = "under";
    else if (isOnDeck && dropX > 600 && dropX < 780 && dropY < 342) prep = "on";
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
    <div className="max-w-6xl w-full flex flex-col items-center relative py-10">
      <div className="text-center mb-12">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Interactive Practice</p>
        <h2 className="text-5xl font-serif italic mb-8 text-white">Mastering Prepositions</h2>
        
        {/* Character Area - Squirtle Exclusively for Prepositions */}
        <div className="flex justify-center mb-8">
          <motion.div 
            animate={isCorrect ? { 
              scale: [1, 1.15, 1],
              y: [0, -20, 0],
              rotate: [0, 10, -10, 10, 0]
            } : feedback && !isCorrect ? {
              x: [0, -5, 5, -5, 5, 0]
            } : {}}
            className="relative w-64 h-64 flex items-center justify-center"
          >
            <img 
              src={LESSON_CHARACTERS.prepositions.sprite} 
              alt={LESSON_CHARACTERS.prepositions.name} 
              className={`w-full h-full object-contain transition-all ${feedback && !isCorrect ? 'grayscale brightness-50' : ''}`}
              referrerPolicy="no-referrer"
            />
            
            {/* Beaming Reaction Overlays */}
            {isCorrect && (
              <div className="absolute inset-0 pointer-events-none">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path d="M35,40 Q40,35 45,40" fill="none" stroke="#333" strokeWidth="4" strokeLinecap="round" />
                  <path d="M55,40 Q60,35 65,40" fill="none" stroke="#333" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="25" cy="55" r="8" fill="#FFB6C1" opacity="0.8" />
                  <circle cx="75" cy="55" r="8" fill="#FFB6C1" opacity="0.8" />
                </svg>
              </div>
            )}

            {/* Speech Bubbles */}
            <AnimatePresence>
              {(isCorrect || feedback) && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: -40 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`absolute -top-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl border-2 font-black z-50 min-w-[250px] text-center ${
                    isCorrect ? 'bg-white border-pikachu text-teal-900' : 'bg-white border-rose-400 text-rose-600'
                  }`}
                >
                  {isCorrect ? "Excellent! Perfect Accuracy." : feedback}
                  <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-2 border-b-2 rotate-45 ${
                    isCorrect ? 'border-pikachu' : 'border-rose-400'
                  }`} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Star Burst */}
            <AnimatePresence>
              {isCorrect && (
                <motion.div
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: -120 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-0 text-amber-500 font-black text-5xl z-50 drop-shadow-lg"
                >
                  +10 ⭐
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <p className="text-2xl text-white font-bold">
          “{currentLevel.instruction}”
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full">
        <div className="flex flex-col items-center flex-grow max-w-5xl">
          <div 
            ref={containerRef}
            className="relative w-full aspect-video rounded-[50px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] border-[12px] border-[#2a2d30]"
            style={{ perspective: '1000px' }}
          >
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

            {isDragging && (
              <svg viewBox="0 0 800 450" className="absolute inset-0 w-full h-full pointer-events-none opacity-20 z-10">
                <ellipse cx="450" cy="306" rx="220" ry="54" fill="cyan" />
                <rect x="600" y="342" width="180" height="90" fill="yellow" />
                <rect x="600" y="288" width="180" height="54" fill="orange" />
              </svg>
            )}

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

            <div className="absolute inset-0 pointer-events-none z-30 bg-gradient-to-t from-black/20 to-transparent" />
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
    </div>
  );
};

const QuizPage = ({ lessonId, isSimpler = false, onComplete, onNextModule, onBack }: { lessonId: string, isSimpler?: boolean, onComplete: (score: number) => void, onNextModule?: () => void, onBack?: () => void }) => {
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
    const canJumpToNext = isSimpler && percentage >= 50; // ← UPDATED 2026: New condition for jumping to next module

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
            <>
              <button 
                onClick={() => onComplete(percentage)}
                className="w-full bg-ink text-white font-bold py-5 rounded-2xl hover:bg-stone-800 transition-all flex items-center justify-center gap-3 btn-plushy"
              >
                Return to Main Quiz
                <CheckCircle2 size={18} />
              </button>
              {onNextModule && (
                <button 
                  onClick={onNextModule}
                  className="w-full bg-ink text-white font-bold py-5 rounded-2xl hover:bg-stone-800 transition-all flex items-center justify-center gap-3 btn-plushy"
                >
                  Jump to Next Module
                  <ArrowRight size={18} />
                </button>
              )}
            </>
          ) : (
            <>
              <button 
                onClick={() => onComplete(percentage)}
                className={`w-full ${isSimpler ? 'bg-ink hover:bg-stone-800' : 'bg-primary hover:bg-blue-600'} text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 btn-plushy`}
              >
                {isSimpler ? "Return to Main Quiz" : "Try Simpler Quiz"}
                <ArrowRight size={18} />
              </button>
              {canJumpToNext && onNextModule && (
                <button 
                  onClick={onNextModule}
                  className="w-full bg-ink text-white font-bold py-5 rounded-2xl hover:bg-stone-800 transition-all flex items-center justify-center gap-3 btn-plushy"
                >
                  Jump to Next Module
                  <ArrowRight size={18} />
                </button>
              )}
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
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-3 bg-white rounded-2xl shadow-sm border border-stone-100 text-ink hover:bg-stone-50 transition-all active:scale-95"
            >
              <ChevronLeft size={20} />
            </button>
          )}
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

const ChooseActionPage = ({ lessonId, onWatchVideo, onStartQuiz, onStartPractice, onBack }: { lessonId: string, onWatchVideo: () => void, onStartQuiz: () => void, onStartPractice: () => void, onBack: () => void }) => {
  const lessonChar = LESSON_CHARACTERS[lessonId] || LESSON_CHARACTERS.nouns;
  
  return (
    <div className="max-w-4xl w-full text-center relative">
      <div className="flex items-center justify-center gap-8 mb-12 relative">
        {/* Left Character - Lesson Specific */}
        <motion.img 
          initial={{ x: -30, opacity: 0, rotate: -10 }}
          animate={{ x: 0, opacity: 1, rotate: 0 }}
          src={lessonChar.sprite} 
          alt={lessonChar.name} 
          className="w-40 h-40 object-contain drop-shadow-xl"
          referrerPolicy="no-referrer"
        />
        
        <div className="text-left">
          <h1 className="text-5xl font-serif italic mb-2">Choose Your Path {lessonChar.emoji}</h1>
          <p className="text-lg text-muted font-medium">Are you ready to test your skills, or would you like to practice first?</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <button 
          onClick={onStartPractice}
          className="p-10 bg-white rounded-[40px] shadow-xl border-2 transition-all group text-left btn-plushy"
          style={{ borderColor: `${lessonChar.color}40` }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" style={{ backgroundColor: `${lessonChar.color}20` }}>
            <div className="text-3xl">{lessonChar.emoji}</div>
          </div>
          <h3 className="text-2xl font-serif italic mb-2">Let's Practice</h3>
          <p className="text-sm text-muted font-medium">
            {lessonId === 'prepositions' ? 'Drag and drop simulation!' : 'Mini-challenge review!'}
          </p>
        </button>

        <button 
          onClick={onStartQuiz}
          className="p-10 bg-white rounded-[40px] shadow-xl border border-stone-50 hover:border-green/20 transition-all group text-left btn-plushy"
        >
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-100 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-green-700">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
              <line x1="6" y1="1" x2="6" y2="4" className="opacity-40" />
              <line x1="10" y1="1" x2="10" y2="4" className="opacity-40" />
              <line x1="14" y1="1" x2="14" y2="4" className="opacity-40" />
            </svg>
          </div>
          <h3 className="text-2xl font-serif italic mb-2">Quiz Time</h3>
          <p className="text-sm text-muted font-medium">Jump straight into the test!</p>
        </button>

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
      </div>
    </div>
  );
};

const LessonContentPage = ({ lessonId, onContinue, onBack }: { lessonId: string, onContinue: () => void, onBack: () => void }) => {
  const content = LESSON_CONTENT[lessonId];
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [step, setStep] = useState(0);

  if (!content) return null;

  const steps = [
    { title: "The Concept", content: content.body, reaction: 'thinking' as const, ash: "Every great student starts with the basics!" },
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

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  return (
    <div className="max-w-5xl w-full relative">
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
                <div className="text-center py-4">
                  <p className="text-xl text-muted font-medium mb-8">
                    You've completed the lesson! Are you ready to earn your badge?
                  </p>
                  <div className="flex justify-center gap-4">
                    <motion.div 
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="w-20 h-20 bg-pikachu/20 rounded-full flex items-center justify-center relative"
                    >
                      <Award size={40} className="text-pikachu" />
                      {/* Subtle water ripple */}
                      <motion.div 
                        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 border-2 border-pikachu/30 rounded-full"
                      />
                    </motion.div>
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
                  ? "Next" 
                  : "Lesgooooooo"}
                <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          {step < 2 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-[40px] overflow-hidden shadow-2xl border-8 border-white max-w-[280px] mx-auto"
            >
              <img 
                src={content.image} 
                alt={content.title} 
                className="w-full h-auto object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          )}

          <div className="bg-pikachu/10 p-6 rounded-[40px] border border-pikachu/20 max-w-[280px] mx-auto">
            <GrammaChu 
              reaction={isSpeaking ? 'surprised' : steps[step].reaction} 
              message={isSpeaking ? "Listening carefully..." : undefined} 
            />
            <p className="text-xs text-stone-700 font-bold italic text-center leading-relaxed mt-4">
              "Did you know? {content.title} are like the {step === 0 ? 'foundation' : step === 1 ? 'moves' : 'victory'} of every sentence!"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginPage = ({ assets }: { assets: any }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showAuth, setShowAuth] = useState(false);
  const [showAuthOptions, setShowAuthOptions] = useState(false); // ← UPDATED 2026: New state for auth options overlay
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [className, setClassName] = useState('Class 2');
  const login = useStore((state) => state.login);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = mode === 'register' ? name : email.split('@')[0];
    if (displayName.trim()) {
      login(displayName, className);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white relative overflow-x-hidden flex flex-col">
      {/* Magical Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-blue-400 to-teal-400 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.15, 0.1],
            rotate: [0, -90, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-[120px]"
        />
        
        {/* Floating Particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              opacity: 0 
            }}
            animate={{ 
              y: [null, "-20%"],
              opacity: [0, 0.5, 0],
              scale: [0, 1, 0]
            }}
            transition={{ 
              duration: Math.random() * 5 + 5, 
              repeat: Infinity,
              delay: Math.random() * 5
            }}
            className="absolute w-2 h-2 bg-blue-300 rounded-full blur-sm"
          />
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center pt-24 pb-12 px-6 relative">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none text-stone-100">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-100/30 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-100/30 rounded-full blur-[120px]" />
        </div>

        <AnimatePresence mode="wait">
          {!showAuth ? (
            <motion.div 
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl w-full text-center z-10 flex flex-col items-center"
            >
              <div className="w-32 h-32 bg-teal-50 rounded-[40px] flex items-center justify-center mb-8 shadow-xl shadow-teal-100/50 border-2 border-white relative">
                <GraduationCap size={64} className="text-teal-600" />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-orange-400 rounded-full border-4 border-white shadow-sm"
                />
              </div>

              <h1 className="text-7xl md:text-8xl font-serif italic mb-6 text-teal-900 tracking-tight leading-none">
                GrammarPal
              </h1>
              
              <p className="text-2xl md:text-3xl font-medium text-stone-600 mb-16 max-w-2xl">
                Master Grammar with <span className="text-teal-600 font-bold italic">Fun Battles!</span>
              </p>

              <div className="relative mb-16 mt-12">
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10"
                >
                  <GrammaChu reaction="happy" />
                </motion.div>
                {/* Decorative Rings */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-dashed border-teal-200 rounded-full animate-[spin_20s_linear_infinite]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-stone-100 rounded-full" />
              </div>

              <button 
                onClick={() => setShowAuthOptions(true)} // ← UPDATED 2026: Show options overlay instead of direct register
                className="group relative px-12 py-6 bg-[#FFCC70] text-teal-900 font-black text-xl rounded-3xl shadow-2xl shadow-orange-200 hover:bg-[#ffd68a] hover:-translate-y-1 transition-all flex items-center gap-4 active:scale-95"
              >
                Start Your Adventure
                <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="auth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white p-10 rounded-[48px] shadow-2xl border-2 border-stone-50 relative z-10"
            >
              <button 
                onClick={() => setShowAuth(false)}
                className="absolute top-6 left-6 p-2 text-stone-400 hover:text-stone-600 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>

              <div className="text-center mb-8">
                <h2 className="text-3xl font-serif italic mb-2 text-teal-900">
                  {mode === 'login' ? 'Welcome Back!' : 'Join the Adventure'}
                </h2>
                <p className="text-stone-500 font-medium text-sm">
                  {mode === 'login' ? 'Continue your journey to mastery.' : 'Create your account to start learning.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <AnimatePresence mode="wait">
                  {mode === 'register' && (
                    <div className="space-y-5">
                      <motion.div
                        key="name"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-left overflow-hidden"
                      >
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 ml-1 mb-2 block">What should we call you?</label>
                        <div className="relative">
                          <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-stone-50 border-2 border-transparent focus:border-teal-600/20 focus:bg-white transition-all outline-none font-medium text-ink"
                            placeholder="Enter your name"
                            required={mode === 'register'}
                          />
                        </div>
                      </motion.div>

                      <motion.div
                        key="class"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-left overflow-hidden"
                      >
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 ml-1 mb-2 block">Class 🏫</label>
                        <div className="relative">
                          <GraduationCap size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400" />
                          <select 
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-stone-50 border-2 border-transparent focus:border-teal-600/20 focus:bg-white transition-all outline-none font-medium text-ink appearance-none cursor-pointer"
                            required={mode === 'register'}
                          >
                            <option value="Class 1">Class 1</option>
                            <option value="Class 2">Class 2</option>
                            <option value="Class 3">Class 3</option>
                            <option value="Class 4">Class 4</option>
                            <option value="Class 5">Class 5</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                <div className="space-y-5">
                  <div className="text-left">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 ml-1 mb-2 block">Email Address</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 rounded-2xl bg-stone-50 border-2 border-transparent focus:border-teal-600/20 focus:bg-white transition-all outline-none font-medium text-ink"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="text-left">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 ml-1 mb-2 block">Secret Password</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 rounded-2xl bg-stone-50 border-2 border-transparent focus:border-teal-600/20 focus:bg-white transition-all outline-none font-medium text-ink"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#FFCC70] text-teal-900 font-black py-5 rounded-2xl shadow-lg hover:bg-[#ffd68a] transition-all flex items-center justify-center gap-2 group btn-plushy mt-4"
                >
                  {mode === 'login' ? 'Continue Journey' : 'Begin Adventure'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-stone-300/50"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold text-stone-400">
                    <span className="bg-white px-4">Or sign in with</span>
                  </div>
                </div>

                <button 
                  type="button"
                  className="w-full bg-white border border-stone-200 text-stone-600 font-bold py-4 rounded-2xl hover:bg-stone-50 transition-all flex items-center justify-center gap-3 shadow-sm btn-plushy"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
              </form>

              <p className="mt-8 text-sm text-stone-500 font-medium text-center">
                {mode === 'login' ? "New to GrammarPal? " : "Already have an account? "}
                <button 
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="text-teal-700 font-bold hover:underline"
                >
                  {mode === 'login' ? "Register here" : "Login here"}
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Options Overlay ← UPDATED 2026 */}
        <AnimatePresence>
          {showAuthOptions && !showAuth && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] bg-white/80 backdrop-blur-md flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white p-12 rounded-[48px] shadow-2xl border-2 border-teal-50 max-w-sm w-full text-center space-y-8"
              >
                <div className="space-y-2">
                  <h3 className="text-3xl font-serif italic text-teal-900">Choose Your Path</h3>
                  <p className="text-stone-500 font-medium">Ready to start your grammar journey?</p>
                </div>
                
                <div className="space-y-4">
                  <button 
                    onClick={() => { setMode('login'); setShowAuth(true); setShowAuthOptions(false); }}
                    className="w-full py-5 rounded-2xl bg-white border-2 border-teal-600/20 text-teal-900 font-bold hover:bg-teal-50 hover:scale-[1.02] transition-all shadow-sm flex items-center justify-center gap-3 group"
                  >
                    <Sparkles size={20} className="text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Login
                    <Sparkles size={20} className="text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <button 
                    onClick={() => { setMode('register'); setShowAuth(true); setShowAuthOptions(false); }}
                    className="w-full py-5 rounded-2xl bg-teal-600 text-white font-bold hover:bg-teal-700 hover:scale-[1.02] transition-all shadow-lg flex items-center justify-center gap-3 group"
                  >
                    <Sparkles size={20} className="text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Sign Up
                    <Sparkles size={20} className="text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>

                <button 
                  onClick={() => setShowAuthOptions(false)}
                  className="text-stone-400 font-bold hover:text-stone-600 transition-colors text-sm"
                >
                  Maybe later
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="p-8 text-center text-stone-400 text-[10px] font-bold uppercase tracking-[0.2em] z-10">
        © 2026 GrammarPal Educational Adventures
      </footer>
    </div>
  );
};

const Navbar = ({ user, onLogout, onBack, showBack, onHelp }: { user: any, onLogout: () => void, onBack?: () => void, showBack?: boolean, onHelp?: () => void }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-md border-b border-stone-100">
      <div className="px-8 py-4 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4 sm:gap-8">
          {/* Back Arrow - FIXED OVERLAP */}
          {showBack && onBack && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onBack}
              className="p-2.5 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all shadow-sm active:scale-95"
              title="Back"
            >
              <ChevronLeft size={20} />
            </motion.button>
          )}
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-ink rounded-xl flex items-center justify-center shadow-lg shadow-stone-200">
              <GraduationCap size={18} className="text-white" />
            </div>
            <span className="font-serif text-xl sm:text-2xl italic tracking-tight text-teal-900">GrammarPal</span>
          </div>

          {showBack && onBack && (
            <button 
              onClick={onBack}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-100 shadow-sm hover:bg-stone-50 transition-all text-muted hover:text-ink font-bold text-[10px] uppercase tracking-widest btn-plushy"
            >
              Back to Dashboard
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5">{user?.class}</p>
            <p className="font-serif text-lg italic text-teal-900 leading-none">{user?.username}</p>
          </div>

          {/* NEED HELP? Leaf - FIXED 2026 */}
          <button 
            onClick={onHelp}
            className="flex flex-col items-center gap-1 group active:scale-95"
          >
            <div className="p-2.5 bg-[#A7D8F0] text-white rounded-full shadow-md hover:shadow-[#A7D8F0]/40 transition-all">
              <Leaf size={20} className="fill-current" />
            </div>
            <span className="text-[9px] font-black text-teal-800 uppercase tracking-widest opacity-70 group-hover:opacity-100 transition-opacity">
              Need Help?
            </span>
          </button>

          <button 
            onClick={onLogout}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors text-muted hover:text-rose-500"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
};

const HomeScreen = ({ assets, loading, error, onRetry, onSelectLesson }: { assets: any, loading: boolean, error: string | null, onRetry: () => void, onSelectLesson: (id: string) => void }) => {
  const user = useStore((state) => state.user);
  const setLesson = useStore((state) => state.setLesson);

  const lessons = [
    { 
      id: 'nouns', 
      title: 'Nouns', 
      color: '#A7D8F0', 
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <path d="M12 6v10" className="opacity-40" />
          <motion.path 
            d="M15 4l2-1M18 7l1-1M16 10l2-1" 
            animate={{ y: [-2, 2, -2], x: [-1, 1, -1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            stroke="#FFCC70"
          />
        </svg>
      )
    },
    { 
      id: 'verbs', 
      title: 'Verbs', 
      color: '#8ED081', 
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <path d="M17.7 7.7A7.1 7.1 0 1 1 5 8c0 .3 0 .6.1.9" />
          <path d="M12 12l3 3" />
          <motion.path 
            d="M2 12h4M2 8h2M2 16h2" 
            animate={{ x: [0, 3, 0], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.path 
            d="M11 19c0 1.7-1.3 3-3 3s-3-1.3-3-3 1.3-3 3-3 3 1.3 3 3z" 
            fill="#8ED081" 
            fillOpacity="0.2"
            animate={{ rotate: [0, 15, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </svg>
      )
    },
    { 
      id: 'tenses', 
      title: 'Tenses', 
      color: '#FFCC70', 
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
          <motion.circle 
            cx="12" cy="12" r="12" 
            stroke="#FFCC70" 
            strokeDasharray="4 4"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="opacity-30"
          />
          <motion.path 
            d="M12 2v2M12 20v2M2 12h2M20 12h2" 
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </svg>
      )
    },
    { 
      id: 'articles', 
      title: 'Articles', 
      color: '#F9A8D4', 
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <motion.text 
            x="2" y="14" fontSize="8" fontWeight="bold" fill="currentColor"
            animate={{ y: [14, 12, 14], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity }}
          >A</motion.text>
          <motion.text 
            x="8" y="18" fontSize="6" fontWeight="bold" fill="currentColor"
            animate={{ y: [18, 16, 18], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
          >An</motion.text>
          <motion.text 
            x="14" y="12" fontSize="7" fontWeight="bold" fill="currentColor"
            animate={{ y: [12, 10, 12], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
          >The</motion.text>
          <circle cx="12" cy="12" r="10" className="opacity-10" fill="currentColor" />
        </svg>
      )
    },
    { 
      id: 'prepositions', 
      title: 'Prepositions', 
      color: '#C084FC', 
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <rect x="8" y="12" width="8" height="8" rx="1" className="opacity-20" fill="currentColor" />
          <motion.path 
            d="M12 4v8m0 0l-3-3m3 3l3-3" 
            animate={{ y: [-2, 2, -2] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.circle 
            cx="12" cy="16" r="2" 
            fill="currentColor"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </svg>
      )
    },
    { 
      id: 'adjectives', 
      title: 'Adjectives', 
      color: '#FDBA74', 
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <motion.path 
            d="M12 2C12 2 19 7 19 12C19 17 12 22 12 22C12 22 5 17 5 12C5 7 12 2 12 2Z" 
            fill="currentColor" 
            fillOpacity="0.1"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <motion.path 
            d="M12 8v8M8 12h8" 
            stroke="#FFCC70"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.path 
            d="M12 2L12 22" 
            stroke="currentColor" 
            strokeOpacity="0.1"
          />
        </svg>
      )
    },
  ];

  return (
    <main className="min-h-screen w-full bg-[#fdf6e3] relative overflow-hidden flex flex-col pt-28"> {/* ← UPDATED 2026: pt-28 for fixed Navbar */}
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
      
      <div className="relative z-20 max-w-7xl mx-auto px-8 py-8 w-full flex-grow flex flex-col"> {/* ← UPDATED 2026: Reduced py-12 to py-8 */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12"> {/* ← UPDATED 2026: Reduced mb-16 to mb-12 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-5xl font-serif italic mb-2 leading-tight">
              Welcome back, <br />
              <span className="text-teal-800 not-italic font-sans font-extrabold tracking-tighter">{user?.username}</span>
            </h2>
            <p className="text-stone-600 font-medium">Your journey to linguistic mastery continues.</p>
          </motion.div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-4 shadow-sm"
            >
              <div className="text-amber-800 text-xs font-bold">
                <p>AI Magic Resting</p>
                <p className="font-normal opacity-70">Classic assets loaded for your journey.</p>
              </div>
              <button 
                onClick={onRetry}
                disabled={loading}
                className="px-4 py-2 bg-amber-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-amber-700 transition-all disabled:opacity-50"
              >
                {loading ? "Waking AI..." : "Try Magic Again"}
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
                message={loading ? "Generating your world..." : error ? "Oops! The spirits are tired. Retry?" : "The water is perfect! Click a badge below to start your learning journey!"} 
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 max-w-5xl mx-auto mt-12 pb-24">
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
                  onClick={() => onSelectLesson(lesson.id)}
                  className="relative group cursor-pointer"
                >
                  {/* Ghibli Style Card */}
                  <motion.div 
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="relative w-40 h-52 bg-[#FFF6E5] rounded-[2rem] shadow-[0_10px_30px_-10px_rgba(200,155,109,0.3)] border-b-4 border-[#C89B6D]/30 overflow-hidden flex flex-col items-center justify-center p-6 transition-all duration-500"
                  >
                    {/* Subtle Wood Texture Overlay */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]" />
                    
                    {/* Soft Glow Background */}
                    <div 
                      className="absolute inset-0 opacity-10 transition-opacity duration-500 group-hover:opacity-20"
                      style={{ background: `radial-gradient(circle at center, ${lesson.color}, transparent)` }}
                    />

                    {/* Ripple Effect on Hover */}
                    <motion.div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-10 pointer-events-none"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0, 0.1, 0]
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                      style={{ border: `2px solid ${lesson.color}`, borderRadius: '2rem' }}
                    />

                    {/* Icon Container */}
                    <div 
                      className="relative z-10 mb-6 p-4 rounded-full transition-transform duration-500 group-hover:scale-110"
                      style={{ color: '#202124', backgroundColor: `${lesson.color}20` }}
                    >
                      {lesson.icon}
                    </div>

                    {/* Title */}
                    <span className="relative z-10 text-[#202124] font-serif text-xl italic tracking-tight opacity-90">
                      {lesson.title}
                    </span>

                    {/* Floating Petal Overlay (Subtle) */}
                    <motion.div 
                      className="absolute top-2 right-2 w-4 h-4 opacity-20"
                      animate={{ 
                        y: [0, 10, 0], 
                        x: [0, -5, 0], 
                        rotate: [0, 45, 0] 
                      }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <svg viewBox="0 0 24 24" fill="#FFCC70">
                        <path d="M12,2C12,2 15,6 15,10C15,14 12,18 12,18C12,18 9,14 9,10C9,6 12,2 12,2Z" />
                      </svg>
                    </motion.div>
                  </motion.div>
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

const HelpModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-[#FFF6E5] rounded-[32px] shadow-2xl overflow-hidden border-8 border-[#C89B6D]/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Wood Texture Border Effect */}
            <div className="absolute inset-0 border-[12px] border-[#C89B6D]/10 pointer-events-none rounded-[24px]" />
            
            {/* Header */}
            <div className="p-8 flex justify-between items-center bg-white/50 border-b border-[#C89B6D]/10 relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-pikachu/20 rounded-full flex items-center justify-center">
                  <Leaf size={24} className="text-[#A7D8F0]" />
                </div>
                <h2 className="text-2xl font-serif italic text-[#202124]">Need Help?</h2>
              </div>
              <button 
                onClick={onClose}
                className="absolute -top-4 -right-4 w-12 h-12 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 hover:scale-110 transition-all flex items-center justify-center z-50 border-4 border-white"
                aria-label="Close"
              >
                <X size={24} strokeWidth={3} />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#C89B6D] uppercase tracking-widest">Your Message</label>
                <textarea 
                  placeholder="Type your doubt here..."
                  className="w-full h-40 p-6 bg-white rounded-2xl border-2 border-[#C89B6D]/10 focus:border-pikachu/50 outline-none transition-all resize-none font-medium text-ink placeholder:text-muted/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#C89B6D] uppercase tracking-widest">Optional Attachment</label>
                <div className="w-full p-8 border-2 border-dashed border-[#C89B6D]/20 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/50 transition-all cursor-pointer group">
                  <Leaf size={32} className="text-[#A7D8F0] group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-muted">Attach screenshot</span>
                </div>
              </div>

              <button className="w-full py-5 bg-[#FFCC70] text-[#202124] font-bold rounded-2xl shadow-lg shadow-orange-200/50 hover:bg-[#ffbd4a] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:scale-95">
                <Send size={20} />
                Send to Teacher
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- Main App ---

const MODULE_ORDER = ['nouns', 'verbs', 'articles', 'prepositions', 'pronouns', 'adjectives']; // ← UPDATED 2026: Defined module sequence

export default function App() {
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);
  const currentLesson = useStore((state) => state.currentLesson);
  const setLesson = useStore((state) => state.setLesson);
  const [view, setView] = useState<'lesson' | 'choose_action' | 'video' | 'quiz' | 'simpler_quiz' | 'practice'>('lesson');
  const [navigationHistory, setNavigationHistory] = useState<{ view: string, lesson: string }[]>([]);
  const { assets, loading, error, generate } = useAssets();
  const [isCourseComplete, setIsCourseComplete] = useState(false); // ← UPDATED 2026: New state for course completion

  const setScore = useStore((state) => state.setScore);

  React.useEffect(() => {
    if (user?.isLoggedIn && !assets.bg && !loading) {
      generate();
    }
  }, [user?.isLoggedIn]);

  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Track navigation history
  React.useEffect(() => {
    if (!user?.isLoggedIn) {
      setNavigationHistory([]);
      return;
    }

    const currentState = { view, lesson: currentLesson || '' };
    
    setNavigationHistory(prev => {
      if (prev.length === 0) {
        if (!currentLesson) return [];
        return [currentState];
      }

      const last = prev[prev.length - 1];
      if (last.view === currentState.view && last.lesson === currentState.lesson) {
        return prev;
      }

      // If we are moving back (i.e., the new state is the one before the last one)
      if (prev.length > 1) {
        const secondLast = prev[prev.length - 2];
        if (secondLast.view === currentState.view && secondLast.lesson === currentState.lesson) {
          return prev.slice(0, -1);
        }
      }

      return [...prev, currentState];
    });
  }, [view, currentLesson, user?.isLoggedIn]);

  const handleGlobalBack = () => {
    if (isHelpModalOpen) {
      setIsHelpModalOpen(false);
      return;
    }

    if (navigationHistory.length <= 1) {
      // Go back to dashboard
      setLesson('');
      setView('lesson');
      setNavigationHistory([]);
      return;
    }

    const prev = navigationHistory[navigationHistory.length - 2];
    setLesson(prev.lesson);
    setView(prev.view as any);
  };

  const handleBackToDashboard = () => {
    setLesson('');
    setView('lesson');
  };

  const handleLessonBack = () => {
    setLesson('');
    setView('lesson');
  };

  const handleChooseActionBack = () => {
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

  const handleNextModule = () => {
    const currentIndex = MODULE_ORDER.indexOf(currentLesson || '');
    if (currentIndex !== -1 && currentIndex < MODULE_ORDER.length - 1) {
      const nextLesson = MODULE_ORDER[currentIndex + 1];
      setLesson(nextLesson);
      setView('lesson');
    } else if (currentIndex === MODULE_ORDER.length - 1) {
      setIsCourseComplete(true);
      setLesson('');
      setView('lesson');
    } else {
      setLesson('');
      setView('lesson');
    }
  };

  return (
    <div className="antialiased selection:bg-primary/10 min-h-screen bg-surface subtle-grain relative">
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />

      {user?.isLoggedIn && (
        <Navbar 
          user={user} 
          onLogout={logout} 
          onBack={handleGlobalBack} // ← UPDATED 2026: Use handleGlobalBack for consistent arrow behavior
          showBack={!!currentLesson || isHelpModalOpen} // ← UPDATED 2026: Show when lesson or help is active
          onHelp={() => setIsHelpModalOpen(true)} // ← UPDATED 2026: Pass help handler
        />
      )}
      <AnimatePresence mode="wait">
        {!user?.isLoggedIn ? (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoginPage assets={assets} />
          </motion.div>
        ) : isCourseComplete ? ( // ← UPDATED 2026: Show course complete screen
          <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center p-8 w-full pt-28 text-center">
            <div className="max-w-md bg-white p-12 rounded-[48px] shadow-2xl border-2 border-teal-50 space-y-8">
              <div className="w-32 h-32 bg-teal-50 rounded-[40px] flex items-center justify-center mx-auto shadow-xl shadow-teal-100/50 border-2 border-white relative">
                <Trophy size={64} className="text-teal-600" />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-orange-400 rounded-full border-4 border-white shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <h2 className="text-4xl font-serif italic text-teal-900">All Done! Great Job!</h2>
                <p className="text-stone-500 font-medium">You've mastered all the modules in GrammarPal. You're a true Grammar Master now!</p>
              </div>
              <button 
                onClick={() => setIsCourseComplete(false)}
                className="w-full py-5 rounded-2xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition-all shadow-lg flex items-center justify-center gap-3 group btn-plushy"
              >
                Back to Dashboard
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        ) : !currentLesson ? (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
            <HomeScreen 
              assets={assets} 
              loading={loading} 
              error={error} 
              onRetry={generate} 
              onSelectLesson={(id) => {
                setLesson(id);
                setView('lesson');
              }}
            />
          </motion.div>
        ) : (
          <motion.div 
            key="content" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-8 w-full pt-28" // ← UPDATED 2026: pt-28 for fixed Navbar
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
                onBack={handleLessonBack}
              />
            )}
            {view === 'choose_action' && (
              <ChooseActionPage 
                lessonId={currentLesson}
                onWatchVideo={() => setView('video')}
                onStartQuiz={() => setView('quiz')}
                onStartPractice={() => setView('practice')}
                onBack={handleChooseActionBack}
              />
            )}
            {view === 'practice' && (
              <InteractivePractice 
                lessonId={currentLesson}
                onComplete={() => setView('quiz')}
                onWatchVideo={() => setView('video')}
                onHelp={() => setIsHelpModalOpen(true)}
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
                onNextModule={handleNextModule}
                onBack={handleGlobalBack}
              />
            )}
            {view === 'simpler_quiz' && (
              <QuizPage 
                lessonId={currentLesson} 
                isSimpler={true}
                onComplete={handleSimplerQuizComplete} 
                onNextModule={handleNextModule}
                onBack={handleGlobalBack}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
