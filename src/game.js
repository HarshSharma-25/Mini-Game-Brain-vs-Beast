const monsterSound=new Audio('assets/monster.mp3');
const manSound=new Audio('assets/run.mp3')
const winSound=new Audio('assets/winSound.wav')
const startGame=new Audio('assets/start.mp3')
const overGame=new Audio('assets/over.mp3')
const death=new Audio('assets/lost.mp3')
const lostlive=new Audio('assets/lostlive.mp3')
const man=document.querySelector('.man')
const gamePath=document.querySelector('.game-path')
const monster=document.querySelector('.monster')
const quiz=document.querySelector('.question')
const greenbtn=document.querySelector('.green')
const redbtn=document.querySelector('.red')
const scoreDisplay=document.querySelector('#score')
const finalScore=document.querySelector('#final-score')
const lives=document.querySelector('#lives')
const newGame=document.querySelector('.new-game')
const questionProgress=document.querySelector('#question-progress')
const answerFeedback=document.querySelector('#answer-feedback')
const feedbackTitle=document.querySelector('#feedback-title')
const feedbackMsg=document.querySelector('#feedback-msg')
const resultWinner=document.querySelector('#result-winner')
const resultScore=document.querySelector('#result-score')
const resultAccuracy=document.querySelector('#result-accuracy')
const resultLives=document.querySelector('#result-lives')
const restartBtn=document.querySelector('#restart-btn')
const gameTimerDisplay=document.querySelector('#game-timer')
const resultTime=document.querySelector('#result-time')
const leaderboardBtn=document.querySelector('#leaderboard-btn')
const resultLeaderboardBtn=document.querySelector('#result-leaderboard-btn')
const leaderboardModal=document.querySelector('#leaderboard-modal')
const leaderboardCloseBtn=document.querySelector('#leaderboard-close')
const closeModalBtn=document.querySelector('#close-modal-btn')
const clearRecordsBtn=document.querySelector('#clear-records-btn')
const leaderboardRows=document.querySelector('#leaderboard-rows')
const leaderboardEmpty=document.querySelector('#leaderboard-empty')
const tabBtns=document.querySelectorAll('.tab-btn')
const soundToggle=document.querySelector('#sound-toggle')
const categoryModal=document.querySelector('#category-modal')
const categoryCloseBtn=document.querySelector('#category-close')
const cancelCategoryBtn=document.querySelector('#cancel-category-btn')
const startBattleBtn=document.querySelector('#start-battle-btn')
const categoryCards=document.querySelectorAll('.category-card')
const modalDiffBtns=document.querySelectorAll('.modal-diff-btn')
const categoryBadge=document.querySelector('#category-badge')
const categoryBadgeText=document.querySelector('#category-badge-text')
const questionCategoryTag=document.querySelector('#question-category-tag')
const resultCategory=document.querySelector('#result-category')
const resultDifficulty=document.querySelector('#result-difficulty')

let selectedCategory = "Mixed Questions";

function getCategoryIcon(cat) {
  switch (cat) {
    case "General Knowledge": return "🌍";
    case "Artificial Intelligence": return "🤖";
    case "Data Science": return "📊";
    case "Computer Science": return "💻";
    case "Aptitude & Logical Reasoning": return "🧩";
    default: return "🎲";
  }
}

function updateCategoryDisplay(que) {
  const icon = getCategoryIcon(selectedCategory);
  if (categoryBadge) {
    const iconSpan = categoryBadge.querySelector(".cat-badge-icon");
    if (iconSpan) iconSpan.textContent = icon;
    if (categoryBadgeText) categoryBadgeText.textContent = selectedCategory;
  }
  if (questionCategoryTag) {
    const activeCat = (que && que.category) ? que.category : selectedCategory;
    const diffName = level === 1 ? "Easy" : level === 2 ? "Medium" : "Hard";
    const catIcon = getCategoryIcon(activeCat);
    questionCategoryTag.textContent = `${catIcon} ${activeCat} • ${diffName}`;
  }
}

let feedbackTimeout=null;
let monkeyReactionTimeout=null;
let isMuted=false;
let isAnswering=false;

// Stopwatch Game Timer Logic
let gameTimerInterval=null;
let gameSeconds=0;
let isTimerRunning=false;

function formatTime(totalSeconds){
  const minutes=Math.floor(totalSeconds/60);
  const seconds=totalSeconds%60;
  const mm=String(minutes).padStart(2,'0');
  const ss=String(seconds).padStart(2,'0');
  return `${mm}:${ss}`;
}

function updateTimerDisplay(){
  if(gameTimerDisplay){
    gameTimerDisplay.textContent=`⏱️ ${formatTime(gameSeconds)}`;
  }
}

function startTimer(){
  if(isTimerRunning) return;
  isTimerRunning=true;
  if(!gameTimerInterval){
    gameTimerInterval=setInterval(()=>{
      gameSeconds++;
      updateTimerDisplay();
    }, 1000);
  }
}

function stopTimer(){
  isTimerRunning=false;
  if(gameTimerInterval){
    clearInterval(gameTimerInterval);
    gameTimerInterval=null;
  }
}

function resetTimer(){
  stopTimer();
  gameSeconds=0;
  updateTimerDisplay();
}

// Arcade Leaderboard & Best Score/Time Persistence
const STORAGE_KEY="brain_vs_beast_leaderboard";

function getLeaderboard(){
  try{
    const data=localStorage.getItem(STORAGE_KEY);
    return data?JSON.parse(data):[];
  }catch(e){
    return [];
  }
}

function saveLeaderboardRecord(finalScore, totalQ, seconds, levelNum, won, category){
  try{
    const records=getLeaderboard();
    const newRecord={
      id: Date.now(),
      score: finalScore,
      total: totalQ,
      seconds: seconds,
      timeFormatted: formatTime(seconds),
      level: levelNum,
      levelName: levelNum===1?"Easy":levelNum===2?"Medium":"Hard",
      category: category || selectedCategory || "Mixed Questions",
      won: won,
      date: new Date().toLocaleDateString(undefined, {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})
    };
    records.push(newRecord);
    // Sort: Primary by score descending; secondary by fastest seconds ascending
    records.sort((a,b)=>{
      if(b.score!==a.score){
        return b.score - a.score;
      }
      return a.seconds - b.seconds;
    });
    const trimmed=records.slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    return newRecord;
  }catch(e){
    return null;
  }
}

let currentFilterLevel="all";

function renderLeaderboard(filterLevel="all"){
  currentFilterLevel=filterLevel;
  if(!leaderboardRows) return;
  const records=getLeaderboard();
  const filtered=filterLevel==="all"?records:records.filter(r=>String(r.level)===String(filterLevel));

  leaderboardRows.innerHTML="";
  if(filtered.length===0){
    if(leaderboardEmpty) leaderboardEmpty.classList.remove("hidden");
    return;
  }
  if(leaderboardEmpty) leaderboardEmpty.classList.add("hidden");

  filtered.forEach((rec, idx)=>{
    const tr=document.createElement("tr");
    if(idx===0) tr.className="rank-1";
    else if(idx===1) tr.className="rank-2";
    else if(idx===2) tr.className="rank-3";

    const medal=idx===0?"🥇 1st":idx===1?"🥈 2nd":idx===2?"🥉 3rd":`#${idx+1}`;
    const outcomeBadge=rec.won?"🧠 Win":"👹 Beast";

    tr.innerHTML=`
      <td>${medal}</td>
      <td><strong>${rec.score}</strong> / ${rec.total}</td>
      <td>${rec.timeFormatted}</td>
      <td>${rec.levelName}</td>
      <td>${rec.category || "Mixed"}</td>
      <td>${outcomeBadge}</td>
      <td>${rec.date}</td>
    `;
    leaderboardRows.appendChild(tr);
  });
}

function openLeaderboard(tab="all"){
  renderLeaderboard(tab);
  tabBtns.forEach(btn=>{
    btn.classList.toggle("active", btn.dataset.tab===String(tab));
  });
  if(leaderboardModal) leaderboardModal.classList.remove("hidden");
}

function closeLeaderboard(){
  if(leaderboardModal) leaderboardModal.classList.add("hidden");
}

// Retro 8-bit Arcade Sound Synthesizer via Web Audio API
class ArcadeSynthesizer {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  jump() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.22);
      
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    } catch(e) {}
  }

  beastRoar() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(55, now + 0.4);
      
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(360, now);
      filter.frequency.linearRampToValueAtTime(90, now + 0.4);
      
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.4);
    } catch(e) {}
  }

  fireRoar() {
    this.beastRoar();
  }

  hit() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.22);
      
      gain.gain.setValueAtTime(0.26, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch(e) {}
  }

  monkeyChirp() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [0, 0.08, 0.16].forEach((delay, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        const startFreq = 1250 + i * 220;
        osc.frequency.setValueAtTime(startFreq, now + delay);
        osc.frequency.exponentialRampToValueAtTime(startFreq + 550, now + delay + 0.06);
        
        gain.gain.setValueAtTime(0.18, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.06);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.06);
      });
    } catch(e) {}
  }

  bongo(high = false) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      const startFreq = high ? 390 : 260;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(high ? 130 : 85, now + 0.14);
      
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch(e) {}
  }

  click() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(620, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch(e) {}
  }
}

const ArcadeAudio = new ArcadeSynthesizer();

function playSound(audio) {
  if (isMuted) return;
  if (audio) {
    try {
      const p = audio.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {});
      }
    } catch(e) {}
  }
}

function triggerMonkeyReaction(type) {
  const monkeys = document.querySelector(".jungle-monkeys");
  if (!monkeys) return;
  if (monkeyReactionTimeout) {
    clearTimeout(monkeyReactionTimeout);
    monkeyReactionTimeout = null;
  }
  monkeys.classList.remove("celebrating", "panicking");
  void monkeys.offsetWidth;
  monkeys.classList.add(type);
  monkeyReactionTimeout = setTimeout(() => {
    monkeys.classList.remove(type);
    monkeyReactionTimeout = null;
  }, 900);
}

greenbtn.disabled=true;
redbtn.disabled=true;

let correctAns=null;
let score=0;
let correctCount=0;
let indx=0;
let chances=3;
let questions=[];
let manSpeed=2;
let monsterSpeed=3;
let monsterPosition=10;
let manPosition=100;
let soundInterval;
let level = 1;

const QUESTION_DATABASE = [
  // ================= GENERAL KNOWLEDGE (EASY) =================
  { question: "The Earth is the third planet from the Sun.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "easy" },
  { question: "Spiders have six legs.", options: ["True", "False"], correct_answer: "False", category: "General Knowledge", difficulty: "easy" },
  { question: "Sharks are mammals.", options: ["True", "False"], correct_answer: "False", category: "General Knowledge", difficulty: "easy" },
  { question: "Lightning never strikes the same place twice.", options: ["True", "False"], correct_answer: "False", category: "General Knowledge", difficulty: "easy" },
  { question: "Goldfish only have a memory span of three seconds.", options: ["True", "False"], correct_answer: "False", category: "General Knowledge", difficulty: "easy" },
  { question: "Water expands when it freezes into ice.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "easy" },
  { question: "The Pacific Ocean is the largest ocean on Earth.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "easy" },
  { question: "Mount Everest is the highest mountain above sea level.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "easy" },
  { question: "Diamonds are made of pure carbon.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "easy" },
  { question: "Light travels faster than sound.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "easy" },
  { question: "Bats are completely blind.", options: ["True", "False"], correct_answer: "False", category: "General Knowledge", difficulty: "easy" },
  { question: "Mars is known as the Red Planet.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "easy" },
  { question: "The capital city of France is Paris.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "easy" },
  { question: "The Atlantic Ocean is larger than the Pacific Ocean.", options: ["True", "False"], correct_answer: "False", category: "General Knowledge", difficulty: "easy" },
  { question: "An adult human skeleton consists of 206 bones.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "easy" },

  // ================= GENERAL KNOWLEDGE (MEDIUM) =================
  { question: "Sound travels faster in water than in air.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "medium" },
  { question: "The Great Wall of China is visible from the Moon with the naked eye.", options: ["True", "False"], correct_answer: "False", category: "General Knowledge", difficulty: "medium" },
  { question: "Humans and chimpanzees share over 95% of their DNA.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "medium" },
  { question: "Venus is the hottest planet in our solar system.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "medium" },
  { question: "An octopus has three hearts.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "medium" },
  { question: "Honey never spoils under natural sealed conditions.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "medium" },
  { question: "The chemical symbol for Gold on the periodic table is Au.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "medium" },
  { question: "The Sahara Desert is the largest desert on Earth.", options: ["True", "False"], correct_answer: "False", category: "General Knowledge", difficulty: "medium" },
  { question: "Penicillin was discovered by Alexander Fleming.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "medium" },
  { question: "The human heart has four distinct chambers.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "medium" },
  { question: "Pluto is classified as a dwarf planet by the International Astronomical Union.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "medium" },
  { question: "Venus rotates in the opposite clockwise direction compared to Earth.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "medium" },
  { question: "The official currency of Japan is the Yuan.", options: ["True", "False"], correct_answer: "False", category: "General Knowledge", difficulty: "medium" },
  { question: "Australia is the only continent that is also a sovereign country.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "medium" },
  { question: "Pure distilled water has a neutral pH value of 7.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "medium" },

  // ================= GENERAL KNOWLEDGE (HARD) =================
  { question: "Bananas grow on trees.", options: ["True", "False"], correct_answer: "False", category: "General Knowledge", difficulty: "hard" },
  { question: "The human skeleton has over 300 bones in adulthood.", options: ["True", "False"], correct_answer: "False", category: "General Knowledge", difficulty: "hard" },
  { question: "Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramids.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "hard" },
  { question: "The number of possible chess games exceeds the number of atoms in the observable universe.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "hard" },
  { question: "Helium was first discovered on Earth before being observed in the Sun.", options: ["True", "False"], correct_answer: "False", category: "General Knowledge", difficulty: "hard" },
  { question: "The Dead Sea shore is the lowest elevation of dry land on Earth.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "hard" },
  { question: "A single day on Venus is longer than a Venusian year.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "hard" },
  { question: "The speed of light in vacuum is approximately 300,000 meters per second.", options: ["True", "False"], correct_answer: "False", category: "General Knowledge", difficulty: "hard" },
  { question: "Carbon has the highest melting point of all elements on the periodic table.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "hard" },
  { question: "The Great Fire of London occurred in the year 1666.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "hard" },
  { question: "Oxford University is older than the Aztec Empire.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "hard" },
  { question: "Glass is classified as an amorphous solid rather than a true crystalline solid.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "hard" },
  { question: "Water boils at a lower temperature at higher altitudes due to reduced atmospheric pressure.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "hard" },
  { question: "The human brain consumes roughly 20% of the body's total basal metabolic energy.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "hard" },
  { question: "Antarctica is the driest continent on planet Earth.", options: ["True", "False"], correct_answer: "True", category: "General Knowledge", difficulty: "hard" },

  // ================= ARTIFICIAL INTELLIGENCE (EASY) =================
  { question: "AI stands for Artificial Intelligence.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "easy" },
  { question: "Machine Learning is a subfield of Artificial Intelligence.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "easy" },
  { question: "ChatGPT was developed by OpenAI.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "easy" },
  { question: "Supervised learning requires labeled training data.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "easy" },
  { question: "Artificial neural networks are inspired by biological neurons in the human brain.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "easy" },
  { question: "AI models never generate false information or hallucinations.", options: ["True", "False"], correct_answer: "False", category: "Artificial Intelligence", difficulty: "easy" },
  { question: "Computer vision allows machines to interpret and analyze digital images.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "easy" },
  { question: "Natural Language Processing (NLP) enables computers to understand human language.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "easy" },
  { question: "Unsupervised learning requires humans to manually label every single data sample.", options: ["True", "False"], correct_answer: "False", category: "Artificial Intelligence", difficulty: "easy" },
  { question: "Autonomous vehicles use AI and computer vision for lane detection and obstacle avoidance.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "easy" },
  { question: "Spam filters in email services often use machine learning classification algorithms.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "easy" },
  { question: "Deep learning relies on neural networks with multiple hidden layers.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "easy" },
  { question: "Virtual voice assistants like Siri and Alexa utilize AI speech recognition.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "easy" },
  { question: "In AI, an agent is an entity that perceives its environment and takes actions.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "easy" },
  { question: "A training dataset is used to evaluate an AI model after training is finished.", options: ["True", "False"], correct_answer: "False", category: "Artificial Intelligence", difficulty: "easy" },

  // ================= ARTIFICIAL INTELLIGENCE (MEDIUM) =================
  { question: "Overfitting occurs when a model performs well on training data but poorly on test data.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "medium" },
  { question: "Backpropagation is the primary algorithm used to calculate gradients in neural networks.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "medium" },
  { question: "The Turing Test was introduced by Alan Turing in 1950 to evaluate machine intelligence.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "medium" },
  { question: "Convolutional Neural Networks (CNNs) are primarily used for image recognition tasks.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "medium" },
  { question: "In Reinforcement Learning, agents learn by receiving rewards and penalties.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "medium" },
  { question: "K-Nearest Neighbors (KNN) is an eager parametric algorithm with fixed training weights.", options: ["True", "False"], correct_answer: "False", category: "Artificial Intelligence", difficulty: "medium" },
  { question: "Gradient Descent updates weights in the direction of the steepest ascent of the loss function.", options: ["True", "False"], correct_answer: "False", category: "Artificial Intelligence", difficulty: "medium" },
  { question: "Recurrent Neural Networks (RNNs) are designed to handle sequential and time-series data.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "medium" },
  { question: "The vanishing gradient problem is more severe in very deep networks using sigmoid activation.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "medium" },
  { question: "Transfer learning allows a pre-trained model to be fine-tuned on a new related task.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "medium" },
  { question: "Random Forest is an ensemble technique that combines multiple decision trees.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "medium" },
  { question: "The Softmax activation function converts raw output logits into a valid probability distribution.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "medium" },
  { question: "Data augmentation artificially generates modified training images to reduce overfitting.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "medium" },
  { question: "Precision and Recall are always identical regardless of class imbalance.", options: ["True", "False"], correct_answer: "False", category: "Artificial Intelligence", difficulty: "medium" },
  { question: "A Confusion Matrix summarizes true positives, false positives, true negatives, and false negatives.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "medium" },

  // ================= ARTIFICIAL INTELLIGENCE (HARD) =================
  { question: "Standard Transformer self-attention has quadratic O(N^2) computational complexity with sequence length.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "hard" },
  { question: "Generative Adversarial Networks (GANs) consist of a generator and a discriminator.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "hard" },
  { question: "Dropout randomly deactivates neurons during inference to accelerate prediction speed.", options: ["True", "False"], correct_answer: "False", category: "Artificial Intelligence", difficulty: "hard" },
  { question: "Gradient descent is mathematically guaranteed to find the global minimum in non-convex optimization.", options: ["True", "False"], correct_answer: "False", category: "Artificial Intelligence", difficulty: "hard" },
  { question: "BERT is an autoregressive decoder-only language model like GPT.", options: ["True", "False"], correct_answer: "False", category: "Artificial Intelligence", difficulty: "hard" },
  { question: "The Adam optimizer computes adaptive learning rates from estimates of first and second moments of gradients.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "hard" },
  { question: "Residual connections (skip connections) in ResNet allow gradients to flow directly through deep layers.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "hard" },
  { question: "In Transformers, positional encodings are required because self-attention is permutation-equivariant.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "hard" },
  { question: "Zero-shot learning allows an AI model to classify categories it was never explicitly trained on.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "hard" },
  { question: "Kaiming (He) weight initialization is designed specifically for networks with ReLU activation functions.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "hard" },
  { question: "Batch Normalization computes mean and variance across the channel dimension for a single instance.", options: ["True", "False"], correct_answer: "False", category: "Artificial Intelligence", difficulty: "hard" },
  { question: "RLHF (Reinforcement Learning from Human Feedback) uses reward models to align LLM generation.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "hard" },
  { question: "Quantization converts model weights from floating-point (FP32) to lower precision integers (INT8).", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "hard" },
  { question: "LSTM memory cell state updates rely on additive interactions to prevent exponential gradient decay.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "hard" },
  { question: "Contrastive learning pulls representations of augmented views of the same image closer together.", options: ["True", "False"], correct_answer: "True", category: "Artificial Intelligence", difficulty: "hard" },

  // ================= DATA SCIENCE (EASY) =================
  { question: "Pandas is a widely used Python library for tabular data manipulation and analysis.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "easy" },
  { question: "A scatter plot is effective for visualizing the relationship between two numerical variables.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "easy" },
  { question: "The mean is calculated by adding all values and dividing by the total count.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "easy" },
  { question: "Missing data in Python Pandas is commonly represented as NaN (Not a Number).", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "easy" },
  { question: "A pie chart is the best visual tool for high-frequency continuous stock market trends.", options: ["True", "False"], correct_answer: "False", category: "Data Science", difficulty: "easy" },
  { question: "Data cleaning involves handling duplicates and imputing missing records.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "easy" },
  { question: "SQL is a standard language used to query and manage relational database systems.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "easy" },
  { question: "The median represents the 50th percentile of an ordered dataset.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "easy" },
  { question: "Outliers are observations that lie an abnormal distance from other values in the data.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "easy" },
  { question: "NumPy provides high-performance multidimensional arrays and mathematical functions in Python.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "easy" },
  { question: "A Pearson correlation of -1 indicates that there is zero relationship between two variables.", options: ["True", "False"], correct_answer: "False", category: "Data Science", difficulty: "easy" },
  { question: "A histogram is used to show the frequency distribution of a continuous variable.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "easy" },
  { question: "The mode of a dataset is the value that appears with the highest frequency.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "easy" },
  { question: "CSV stands for Comma-Separated Values.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "easy" },
  { question: "Data wrangling transforms raw, unstructured data into a structured format for analysis.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "easy" },

  // ================= DATA SCIENCE (MEDIUM) =================
  { question: "A p-value less than 0.05 typically indicates statistical significance at the 5% alpha level.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "medium" },
  { question: "Correlation between two variables proves that one variable causes the other.", options: ["True", "False"], correct_answer: "False", category: "Data Science", difficulty: "medium" },
  { question: "K-Means clustering requires the analyst to specify the number of clusters (k) in advance.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "medium" },
  { question: "StandardScaler transforms feature data to have a mean of 0 and standard deviation of 1.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "medium" },
  { question: "In a standard box plot, the middle horizontal bar inside the box represents the mean.", options: ["True", "False"], correct_answer: "False", category: "Data Science", difficulty: "medium" },
  { question: "The Interquartile Range (IQR) is calculated as Q3 minus Q1.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "medium" },
  { question: "A Type I error in statistical hypothesis testing occurs when a true null hypothesis is rejected.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "medium" },
  { question: "One-Hot Encoding converts categorical variables into binary 0/1 column vectors.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "medium" },
  { question: "In linear regression, R-squared measures the proportion of variance explained by the model.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "medium" },
  { question: "Stratified K-Fold cross-validation maintains the relative class proportions in each split fold.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "medium" },
  { question: "Variance Inflation Factor (VIF) is used to detect multicollinearity among predictor variables.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "medium" },
  { question: "Logarithmic transformation is commonly used to normalize right-skewed continuous data.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "medium" },
  { question: "In classification, the ROC-AUC score evaluates model performance across all classification thresholds.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "medium" },
  { question: "Imbalanced datasets can result in misleadingly high accuracy despite poor minority class prediction.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "medium" },
  { question: "The Central Limit Theorem applies only when the underlying population distribution is already normal.", options: ["True", "False"], correct_answer: "False", category: "Data Science", difficulty: "medium" },

  // ================= DATA SCIENCE (HARD) =================
  { question: "L1 regularization (Lasso) can shrink regression coefficients to absolute zero for feature selection.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "hard" },
  { question: "In Principal Component Analysis (PCA), all extracted principal components are orthogonal to each other.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "hard" },
  { question: "Homoscedasticity means the variance of the residuals remains constant across all predictor levels.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "hard" },
  { question: "Simpson's Paradox occurs when a statistical trend apparent in sub-groups reverses when groups are merged.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "hard" },
  { question: "Ridge regression (L2) sets unimportant feature coefficients strictly to zero.", options: ["True", "False"], correct_answer: "False", category: "Data Science", difficulty: "hard" },
  { question: "The Silhouette Score for evaluating cluster quality ranges between -1 and +1.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "hard" },
  { question: "In Bayesian inference, the posterior probability is proportional to prior probability times likelihood.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "hard" },
  { question: "t-SNE is a linear algorithm that preserves global distances better than PCA.", options: ["True", "False"], correct_answer: "False", category: "Data Science", difficulty: "hard" },
  { question: "The F1-Score represents the harmonic mean of Precision and Recall.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "hard" },
  { question: "Adjusted R-squared penalizes the addition of non-informative predictor variables in multiple regression.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "hard" },
  { question: "In ARIMA time series modeling, the 'I' parameter denotes the degree of differencing for stationarity.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "hard" },
  { question: "The curse of dimensionality causes data points in high dimensions to become equidistant from each other.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "hard" },
  { question: "Bootstrap Aggregating (Bagging) reduces the variance of unstable models like decision trees.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "hard" },
  { question: "A Type II error occurs when an experiment fails to reject a false null hypothesis.", options: ["True", "False"], correct_answer: "True", category: "Data Science", difficulty: "hard" },
  { question: "DBSCAN clustering requires the user to specify the exact number of clusters beforehand.", options: ["True", "False"], correct_answer: "False", category: "Data Science", difficulty: "hard" },

  // ================= COMPUTER SCIENCE (EASY) =================
  { question: "A single byte consists of 8 individual bits.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "easy" },
  { question: "A stack data structure operates on a Last-In, First-Out (LIFO) order.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "easy" },
  { question: "RAM retains all its data when the computer is powered off.", options: ["True", "False"], correct_answer: "False", category: "Computer Science", difficulty: "easy" },
  { question: "HTML is a compiled object-oriented programming language.", options: ["True", "False"], correct_answer: "False", category: "Computer Science", difficulty: "easy" },
  { question: "Binary search achieves O(log n) average time complexity on sorted arrays.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "easy" },
  { question: "A queue data structure processes items on a First-In, First-Out (FIFO) basis.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "easy" },
  { question: "In languages like Python, C, and JavaScript, array indexing begins at 0.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "easy" },
  { question: "CPU stands for Central Processing Unit.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "easy" },
  { question: "An infinite loop occurs when a loop's termination condition is never satisfied.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "easy" },
  { question: "A compiler converts high-level source code into machine code or bytecode.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "easy" },
  { question: "A boolean data type can hold only two possible values: true or false.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "easy" },
  { question: "An algorithm is a finite, step-by-step sequence of instructions to solve a problem.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "easy" },
  { question: "Python is a statically typed language that does not allow dynamic variable assignment.", options: ["True", "False"], correct_answer: "False", category: "Computer Science", difficulty: "easy" },
  { question: "An operating system manages computer hardware and system software resources.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "easy" },
  { question: "DNS translates human-friendly domain names into numerical IP addresses.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "easy" },

  // ================= COMPUTER SCIENCE (MEDIUM) =================
  { question: "A deadlock requires mutual exclusion, hold and wait, no preemption, and circular wait.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "medium" },
  { question: "QuickSort has a worst-case time complexity of O(n^2).", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "medium" },
  { question: "TCP is a connection-oriented and reliable transport layer network protocol.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "medium" },
  { question: "A hash table provides an average-case search time complexity of O(1).", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "medium" },
  { question: "HTTP is a stateful protocol by default.", options: ["True", "False"], correct_answer: "False", category: "Computer Science", difficulty: "medium" },
  { question: "Breadth-First Search (BFS) on graphs uses a Queue data structure.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "medium" },
  { question: "MergeSort guarantees an O(n log n) time complexity across all cases.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "medium" },
  { question: "In relational databases, a foreign key establishes a relationship between two tables.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "medium" },
  { question: "A doubly linked list allows traversal in both forward and backward directions.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "medium" },
  { question: "Virtual memory uses paging to map virtual addresses to physical RAM addresses.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "medium" },
  { question: "Git is a centralized version control system that cannot work offline.", options: ["True", "False"], correct_answer: "False", category: "Computer Science", difficulty: "medium" },
  { question: "In IPv4, an IP address is composed of 32 bits arranged in 4 octets.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "medium" },
  { question: "Polymorphism in OOP allows objects of different classes to respond to the same interface.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "medium" },
  { question: "Depth-First Search (DFS) can be implemented recursively using the program call stack.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "medium" },
  { question: "Binary search trees guarantee O(log n) lookup even if items are inserted in sorted order.", options: ["True", "False"], correct_answer: "False", category: "Computer Science", difficulty: "medium" },

  // ================= COMPUTER SCIENCE (HARD) =================
  { question: "Dijkstra's shortest path algorithm works correctly on graphs with negative edge weights.", options: ["True", "False"], correct_answer: "False", category: "Computer Science", difficulty: "hard" },
  { question: "Alan Turing proved that the Halting Problem is undecidable on general Turing machines.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "hard" },
  { question: "An AVL tree is a self-balancing binary search tree where subtree heights differ by at most 1.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "hard" },
  { question: "Two-Phase Locking (2PL) guarantees conflict serializability in databases but does not prevent deadlocks.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "hard" },
  { question: "In computational complexity, if P = NP, then every verifiable problem can be solved in polynomial time.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "hard" },
  { question: "In distributed systems, the CAP theorem states a database can guarantee Consistency, Availability, and Partition Tolerance all at once.", options: ["True", "False"], correct_answer: "False", category: "Computer Science", difficulty: "hard" },
  { question: "Bellman-Ford algorithm can detect negative weight cycles in directed graphs.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "hard" },
  { question: "Thrashing in an operating system occurs when excessive paging causes CPU utilization to collapse.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "hard" },
  { question: "The ARP protocol maps an IP address to a physical MAC hardware address on a local network.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "hard" },
  { question: "A B-Tree of order m can hold at most m-1 keys in each internal node.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "hard" },
  { question: "Red-Black trees require at most three tree rotations during an insertion to restore balance.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "hard" },
  { question: "Dynamic Programming requires problems to exhibit optimal substructure and overlapping subproblems.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "hard" },
  { question: "Context-free grammars can be parsed in O(n^3) time using the CYK algorithm.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "hard" },
  { question: "RSA public-key cryptography relies on the difficulty of prime factorization of large integers.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "hard" },
  { question: "A context switch in OS kernel execution involves saving and restoring process CPU registers.", options: ["True", "False"], correct_answer: "True", category: "Computer Science", difficulty: "hard" },

  // ================= APTITUDE & LOGICAL REASONING (EASY) =================
  { question: "If all cats are felines and all felines are animals, then all cats are animals.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "easy" },
  { question: "A standard leap year consists of 366 days.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "easy" },
  { question: "If today is Saturday, then exactly 7 days from today will also be Saturday.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "easy" },
  { question: "The next number in the pattern 2, 4, 8, 16 is 30.", options: ["True", "False"], correct_answer: "False", category: "Aptitude & Logical Reasoning", difficulty: "easy" },
  { question: "If Mary is taller than Jane, and Jane is taller than Lucy, then Mary is taller than Lucy.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "easy" },
  { question: "A planar triangle can contain two interior 90-degree right angles.", options: ["True", "False"], correct_answer: "False", category: "Aptitude & Logical Reasoning", difficulty: "easy" },
  { question: "If a vehicle travels 60 km in 1 hour, it will travel 180 km in 3 hours at constant speed.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "easy" },
  { question: "A prime number is an integer greater than 1 divisible only by 1 and itself.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "easy" },
  { question: "The number 1 is classified as a prime number in mathematics.", options: ["True", "False"], correct_answer: "False", category: "Aptitude & Logical Reasoning", difficulty: "easy" },
  { question: "At 3:00 on an analog clock, the angle between the hour and minute hands is 90 degrees.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "easy" },
  { question: "Opposite faces on a standard six-sided die always add up to 7.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "easy" },
  { question: "If you turn 180 degrees in place, you face the exact opposite direction.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "easy" },
  { question: "An integer is divisible by 5 if and only if its last digit is 0 or 5.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "easy" },
  { question: "The sum of interior angles in any four-sided polygon (quadrilateral) is 360 degrees.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "easy" },
  { question: "If South is directly to your left side, you are facing West.", options: ["True", "False"], correct_answer: "False", category: "Aptitude & Logical Reasoning", difficulty: "easy" },

  // ================= APTITUDE & LOGICAL REASONING (MEDIUM) =================
  { question: "If the speed of a vehicle is doubled, the time required to cover the same distance is halved.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "medium" },
  { question: "If a price increases by 20% and then decreases by 20%, the final price equals the original price.", options: ["True", "False"], correct_answer: "False", category: "Aptitude & Logical Reasoning", difficulty: "medium" },
  { question: "In a group of 6 people, if everyone shakes hands with everyone else once, there are 15 handshakes.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "medium" },
  { question: "At 3:15 on an analog clock, the angle between the hour hand and minute hand is exactly 0 degrees.", options: ["True", "False"], correct_answer: "False", category: "Aptitude & Logical Reasoning", difficulty: "medium" },
  { question: "If Pipe A fills a tank in 4 hours and Pipe B fills it in 4 hours, together they fill it in 2 hours.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "medium" },
  { question: "A person walks 3 km North then 4 km East. The straight-line distance from the start is 5 km.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "medium" },
  { question: "If 'Some apples are fruits' and 'All fruits are healthy', it follows that 'Some apples are healthy'.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "medium" },
  { question: "If the probability of an event happening is 0.35, the probability of it not happening is 0.65.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "medium" },
  { question: "In a race of 5 runners, the number of ways the top 3 podium spots can be awarded is 60.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "medium" },
  { question: "The perimeter of a square with an area of 64 square units is 32 units.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "medium" },
  { question: "A train 100 meters long traveling at 72 km/h crosses a static signal pole in 5 seconds.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "medium" },
  { question: "The arithmetic average of 5 consecutive odd numbers starting from 3 is 7.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "medium" },
  { question: "If the day before yesterday was Thursday, tomorrow will be Sunday.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "medium" },
  { question: "Every century year ending in 00 (such as 1900) is automatically a leap year.", options: ["True", "False"], correct_answer: "False", category: "Aptitude & Logical Reasoning", difficulty: "medium" },
  { question: "If today is Wednesday, exactly 10 days from today will be Saturday.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "medium" },

  // ================= APTITUDE & LOGICAL REASONING (HARD) =================
  { question: "In the Monty Hall problem, switching doors increases the probability of winning from 1/3 to 2/3.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "hard" },
  { question: "A bat and ball cost $1.10 in total. The bat costs $1.00 more than the ball. The ball costs 10 cents.", options: ["True", "False"], correct_answer: "False", category: "Aptitude & Logical Reasoning", difficulty: "hard" },
  { question: "If a clock strikes 6 times in 5 seconds, it will take 10 seconds to strike 11 times.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "hard" },
  { question: "If 'No reptiles are warm-blooded' and 'All birds are warm-blooded', it follows that 'No birds are reptiles'.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "hard" },
  { question: "The probability of getting at least one head in two independent fair coin tosses is 0.75.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "hard" },
  { question: "Two trains traveling toward each other at 40 km/h and 50 km/h have a relative approach speed of 90 km/h.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "hard" },
  { question: "If today is Tuesday, exactly 100 days from today will be Thursday.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "hard" },
  { question: "The sum of the first 20 positive integers (1 to 20) equals 210.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "hard" },
  { question: "A container holds 5 red, 4 blue, and 3 green marbles. The probability of randomly drawing blue is 1/3.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "hard" },
  { question: "If x + 1/x = 3, then the value of x^2 + 1/x^2 equals 9.", options: ["True", "False"], correct_answer: "False", category: "Aptitude & Logical Reasoning", difficulty: "hard" },
  { question: "In a 100m race, A beats B by 10m and B beats C by 10m. Therefore, A beats C by exactly 20m.", options: ["True", "False"], correct_answer: "False", category: "Aptitude & Logical Reasoning", difficulty: "hard" },
  { question: "Compound interest on $1,000 at 10% for 2 years compounded annually equals $210.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "hard" },
  { question: "If a square's side length is increased by 50%, its total area increases by 125%.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "hard" },
  { question: "In formal logic, the statement 'P implies Q' is logically equivalent to 'Not Q implies Not P'.", options: ["True", "False"], correct_answer: "True", category: "Aptitude & Logical Reasoning", difficulty: "hard" },
  { question: "If 5 workers build 5 tables in 5 days, then 10 workers would build 10 tables in 10 days.", options: ["True", "False"], correct_answer: "False", category: "Aptitude & Logical Reasoning", difficulty: "hard" }
];

const fallbackQuestions = QUESTION_DATABASE;

document.querySelectorAll('input[name="difficulty"]').forEach(rbtn => {
  rbtn.addEventListener("change", (e) => {
    level = parseInt(e.target.value, 10);
    setLevel(level);
  });
});
manSound.loop=true;
manSound.volume=1;
monsterSound.volume=0.2;

// Start & Category Modal Navigation
const start = document.querySelector(".start");

function openCategoryModal() {
  ArcadeAudio.init();
  ArcadeAudio.click();
  if (categoryModal) {
    categoryModal.classList.remove("hidden");
    categoryCards.forEach(card => {
      card.classList.toggle("active", card.dataset.category === selectedCategory);
    });
    modalDiffBtns.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.level === String(level));
    });
  }
}

function closeCategoryModal() {
  if (categoryModal) {
    categoryModal.classList.add("hidden");
  }
}

start.addEventListener("click", () => {
  openCategoryModal();
});

function startBattle() {
  closeCategoryModal();
  ArcadeAudio.init();
  startTimer();
  stop.classList.remove("active");
  setButtonsDisabled(false);
  gamePath.classList.add("move");
  man.classList.add("run");
  playSound(startGame);
  playSound(manSound);
  if (soundInterval) clearInterval(soundInterval);
  soundInterval = setInterval(() => {
    playSound(monsterSound);
    setTimeout(() => {
      monsterSound.pause();
      monsterSound.currentTime = 0;
    }, 2000);
  }, 6000);

  monster.classList.add("attack");
  start.classList.add("active");
  updateCategoryDisplay();
  loadQuestions();
}

// Stop Button Handler
const stop = document.querySelector(".stop");
stop.addEventListener("click", () => {
  stopTimer();
  gamePath.classList.remove("move");
  man.classList.remove("run", "jumping", "hit");
  monster.classList.remove("attack", "rage");
  document.body.classList.remove("screen-shake");
  start.classList.remove("active");
  stop.classList.add("active");
  setButtonsDisabled(true);
  manSound.pause();
  monsterSound.pause();
  clearInterval(soundInterval);
});

function setLevel(l) {
  level = l;
  if (level === 1) {
    chances = 3;
    manSpeed = 2;
    monsterSpeed = 3;
  } else if (level === 2) {
    chances = 2;
    manSpeed = 1.5;
    monsterSpeed = 2.5;
  } else if (level === 3) {
    chances = 1;
    manSpeed = 1;
    monsterSpeed = 2;
  }

  // Sync radio buttons in navbar
  const rbtn = document.querySelector(`input[name="difficulty"][value="${level}"]`);
  if (rbtn) rbtn.checked = true;

  // Sync modal difficulty buttons
  document.querySelectorAll(".modal-diff-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.level === String(level));
  });

  lives.textContent = `Lives: ${chances}`;
  updateCategoryDisplay();
}

function loadQuestions() {
  let difficultyStr = level === 1 ? "easy" : level === 2 ? "medium" : "hard";
  let pool = [];

  if (selectedCategory === "Mixed Questions" || selectedCategory === "all") {
    pool = QUESTION_DATABASE.filter(q => q.difficulty === difficultyStr);
  } else {
    pool = QUESTION_DATABASE.filter(q => q.category === selectedCategory && q.difficulty === difficultyStr);
  }

  if (!pool || pool.length === 0) {
    pool = QUESTION_DATABASE.filter(q => q.difficulty === difficultyStr);
  }
  if (!pool || pool.length === 0) {
    pool = QUESTION_DATABASE;
  }

  // Shuffle pool (Fisher-Yates)
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Pick 20 questions
  questions = [];
  for (let i = 0; i < 20; i++) {
    questions.push(shuffled[i % shuffled.length]);
  }

  indx = 0;
  loadQuiz();
}

function loadQuiz(){
  if(indx<questions.length){
    showQuiz(questions[indx]);
  }
  else{
    endQuiz();
  }
   
}

function updateQuestionProgress(){
  if(!questionProgress) return;
  const total = questions.length > 0 ? questions.length : 20;
  const current = questions.length > 0 ? Math.min(indx + 1, total) : 1;
  questionProgress.textContent = `Question: ${current} / ${total}`;
}

function showFeedback(isCorrect){
  if(!answerFeedback) return;
  if(feedbackTimeout){
    clearTimeout(feedbackTimeout);
    feedbackTimeout=null;
  }

  answerFeedback.classList.remove('correct', 'wrong', 'hidden', 'visible');

  if(isCorrect){
    answerFeedback.classList.add('correct');
    if(feedbackTitle) feedbackTitle.textContent = 'CORRECT!';
    if(feedbackMsg) feedbackMsg.textContent = 'Brain moves forward!';
  } else {
    answerFeedback.classList.add('wrong');
    if(feedbackTitle) feedbackTitle.textContent = 'WRONG!';
    if(feedbackMsg) feedbackMsg.textContent = 'Beast gains ground!';
  }

  void answerFeedback.offsetWidth;
  answerFeedback.classList.add('visible');

  feedbackTimeout = setTimeout(() => {
    hideFeedback();
  }, 900);
}

function hideFeedback(){
  if(feedbackTimeout){
    clearTimeout(feedbackTimeout);
    feedbackTimeout=null;
  }
  if(answerFeedback){
    answerFeedback.classList.remove('visible');
    answerFeedback.classList.add('hidden');
  }
}

function showQuiz(que){
    let parser = new DOMParser();
    let decodedQ = parser.parseFromString(que.question, "text/html").body.textContent;
    quiz.textContent=decodedQ;
    correctAns=que.correct_answer==="True"; //returns boolean true/false
    updateCategoryDisplay(que);
    updateQuestionProgress();
}

function setButtonsDisabled(disabled) {
  greenbtn.disabled = disabled;
  redbtn.disabled = disabled;
  if (disabled) {
    greenbtn.classList.add("disabled");
    redbtn.classList.add("disabled");
  } else {
    greenbtn.classList.remove("disabled");
    redbtn.classList.remove("disabled");
  }
}

greenbtn.addEventListener("click", () => {
  if (greenbtn.disabled || isAnswering) return;
  ArcadeAudio.init();
  ArcadeAudio.click();
  check(true);
});
redbtn.addEventListener("click", () => {
  if (redbtn.disabled || isAnswering) return;
  ArcadeAudio.init();
  ArcadeAudio.click();
  check(false);
});
newGame.addEventListener("click", () => newGameFn());

document.addEventListener("keydown", (event) => {
  if (greenbtn.disabled || isAnswering) return;
  if (event.key === "ArrowRight") {
    ArcadeAudio.init();
    ArcadeAudio.click();
    check(false); 
  } else if (event.key === "ArrowLeft") {
    ArcadeAudio.init();
    ArcadeAudio.click();
    check(true); 
  }
});

function endQuiz() {
  hideFeedback();
  stopTimer();
  const isBrainWin = chances > 0;
  const total = questions.length || 20;

  const monkeys = document.querySelector(".jungle-monkeys");
  if (monkeys) monkeys.classList.remove("celebrating", "panicking");
  monsterSound.volume=1;

  if (isBrainWin) {
    quiz.textContent = "Victory!";
    playSound(winSound);
    triggerMonkeyReaction("celebrating");
  } else {
    quiz.textContent = "Game Over!";
    playSound(overGame);
    triggerMonkeyReaction("panicking");
  }

  scoreDisplay.textContent=`Score : ${score}`;

  if (resultWinner) {
    resultWinner.textContent = isBrainWin ? "Brain Wins!" : "Beast Wins!";
    resultWinner.className = `result-winner ${isBrainWin ? 'brain-win' : 'beast-win'}`;
  }
  if (resultCategory) {
    resultCategory.textContent = selectedCategory;
  }
  if (resultDifficulty) {
    resultDifficulty.textContent = level === 1 ? "Easy" : level === 2 ? "Medium" : "Hard";
  }
  if (resultScore) {
    resultScore.textContent = score;
  }
  if (resultTime) {
    resultTime.textContent = formatTime(gameSeconds);
  }
  if (resultAccuracy) {
    resultAccuracy.textContent = `${correctCount} / ${total}`;
  }
  if (resultLives) {
    resultLives.textContent = Math.max(0, chances);
  }

  saveLeaderboardRecord(score, total, gameSeconds, level || 1, isBrainWin, selectedCategory);

  finalScore.style.display="flex";
  setButtonsDisabled(true);
  monsterSound.pause();
  gamePath.classList.remove("move");
  man.classList.remove("run", "jumping", "hit");
  monster.classList.remove("attack", "rage");
  document.body.classList.remove("screen-shake");
  manSpeed=2;
  monsterSpeed=3;
  monsterPosition=10;
  manPosition=100; 
  manSound.pause();
  clearInterval(soundInterval);
  manSound.currentTime=0;
}
function checkLost(){
        if(chances<=0){
            playSound(death);
            triggerMonkeyReaction("panicking");
            monster.style.bottom=manPosition+"px";
            man.classList.remove("run");
            endQuiz();
            return;
        }else{
             scoreDisplay.textContent=`Score : ${score}`;
             loadQuiz();
        }
    }
function check(userChoice){
    if (isAnswering || greenbtn.disabled) return;
    isAnswering = true;
    setTimeout(() => { isAnswering = false; }, 320);

    if(userChoice===correctAns){
        score++;
        correctCount++;
        indx++;
        scoreDisplay.textContent=`Score : ${score}`;
        scoreDisplay.classList.remove("score-pop");
        void scoreDisplay.offsetWidth;
        scoreDisplay.classList.add("score-pop");
        setTimeout(() => scoreDisplay.classList.remove("score-pop"), 400);
        triggerMonkeyReaction("celebrating");
        manSpeed=Math.max(0.5,manSpeed-0.3);
        man.style.animationDuration=`${manSpeed}s`;
        manPosition+=20;
        man.style.bottom=manPosition+"px";

        // Player Heroic Jump Animation & Jump FX
        man.classList.remove("jumping");
        void man.offsetWidth;
        man.classList.add("jumping");
        setTimeout(() => man.classList.remove("jumping"), 650);

        ArcadeAudio.jump();
        ArcadeAudio.monkeyChirp();

        playSound(winSound);
        showFeedback(true);
        loadQuiz();
    }
    else{
        console.log("wrong");
        if(score>0){
          score--;
        }
        if(chances>0){
          chances--;
          playSound(lostlive);
        }
        lives.textContent=`Lives: ${chances}`;
        lives.classList.remove("lives-shake");
        void lives.offsetWidth;
        lives.classList.add("lives-shake");
        setTimeout(() => lives.classList.remove("lives-shake"), 400);
        triggerMonkeyReaction("panicking");

        // Beast Fire Rage Lunge Animation
        monster.classList.remove("rage");
        void monster.offsetWidth;
        monster.classList.add("rage");
        setTimeout(() => monster.classList.remove("rage"), 700);

        // Player Stumble & Hit Reaction
        man.classList.remove("hit");
        void man.offsetWidth;
        man.classList.add("hit");
        setTimeout(() => man.classList.remove("hit"), 500);

        // Screen Shake
        document.body.classList.remove("screen-shake");
        void document.body.offsetWidth;
        document.body.classList.add("screen-shake");
        setTimeout(() => document.body.classList.remove("screen-shake"), 450);

        ArcadeAudio.beastRoar();
        ArcadeAudio.hit();

        indx++;
        monsterSpeed=Math.max(0.8,monsterSpeed-0.3);
        monster.style.animationDuration=`${monsterSpeed}s`;
        monsterPosition+=30;
        monster.style.bottom=monsterPosition+"px";
        showFeedback(false);
        checkLost();
    }
}
function newGameFn(){
  hideFeedback();
  closeCategoryModal();
  const monkeys = document.querySelector(".jungle-monkeys");
  if (monkeys) monkeys.classList.remove("celebrating", "panicking");
  if (monkeyReactionTimeout) {
    clearTimeout(monkeyReactionTimeout);
    monkeyReactionTimeout = null;
  }
  scoreDisplay.classList.remove("score-pop");
  lives.classList.remove("lives-shake");
  score = 0;
  correctCount = 0;
  indx = 0;
  setLevel(level || 1);
  manPosition=100;
  monsterPosition=10;
  resetTimer();

  man.style.bottom=manPosition+"px";
  monster.style.bottom=monsterPosition+"px";

  man.style.animationDuration=`${manSpeed}s`
  monster.style.animationDuration=`${monsterSpeed}s`;

  scoreDisplay.textContent=`Score : ${score}`;
  gamePath.classList.remove("move");
  man.classList.remove("run", "jumping", "hit");
  monster.classList.remove("attack", "rage");
  document.body.classList.remove("screen-shake");
  quiz.textContent = "Start to play";
  start.classList.remove("active");
  stop.classList.remove("active");

  setButtonsDisabled(true);
  finalScore.style.display="none";
  manSound.pause();
  
  manSound.currentTime=0;
  clearInterval(soundInterval);
  updateQuestionProgress();
  updateCategoryDisplay();
}

if (restartBtn) {
  restartBtn.addEventListener("click", () => newGameFn());
}

// Leaderboard Modal Event Handlers
if (leaderboardBtn) {
  leaderboardBtn.addEventListener("click", () => {
    ArcadeAudio.init();
    ArcadeAudio.click();
    openLeaderboard(String(level || "all"));
  });
}

if (resultLeaderboardBtn) {
  resultLeaderboardBtn.addEventListener("click", () => {
    ArcadeAudio.init();
    ArcadeAudio.click();
    openLeaderboard(String(level || "all"));
  });
}

if (leaderboardCloseBtn) {
  leaderboardCloseBtn.addEventListener("click", () => closeLeaderboard());
}
if (closeModalBtn) {
  closeModalBtn.addEventListener("click", () => closeLeaderboard());
}

const leaderboardBackdrop = document.querySelector(".leaderboard-backdrop");
if (leaderboardBackdrop) {
  leaderboardBackdrop.addEventListener("click", () => closeLeaderboard());
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && leaderboardModal && !leaderboardModal.classList.contains("hidden")) {
    closeLeaderboard();
  }
});

tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    ArcadeAudio.init();
    ArcadeAudio.click();
    tabBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderLeaderboard(btn.dataset.tab);
  });
});

if (clearRecordsBtn) {
  clearRecordsBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all high scores and speedrun records?")) {
      localStorage.removeItem(STORAGE_KEY);
      renderLeaderboard(currentFilterLevel);
    }
  });
}

// Interactive clickable monkeys with playful audio feedback
document.querySelectorAll(".monkey-container").forEach((m) => {
  m.addEventListener("click", (e) => {
    e.stopPropagation();
    ArcadeAudio.init();
    if (m.classList.contains("monkey-left-drummer")) {
      ArcadeAudio.bongo(Math.random() > 0.5);
      m.classList.add("celebrating");
      setTimeout(() => m.classList.remove("celebrating"), 400);
    } else {
      ArcadeAudio.monkeyChirp();
      m.style.transform = "scale(1.22)";
      setTimeout(() => { m.style.transform = ""; }, 350);
    }
  });
});

// Sound Toggle Button Handler
if (soundToggle) {
  soundToggle.addEventListener("click", () => {
    isMuted = !isMuted;
    ArcadeAudio.isMuted = isMuted;
    if (isMuted) {
      soundToggle.textContent = "🔇";
      soundToggle.classList.add("muted");
      soundToggle.title = "Unmute Sound";
      manSound.pause();
      monsterSound.pause();
    } else {
      soundToggle.textContent = "🔊";
      soundToggle.classList.remove("muted");
      soundToggle.title = "Mute Sound";
      ArcadeAudio.init();
      ArcadeAudio.click();
      if (start.classList.contains("active") && !stop.classList.contains("active") && finalScore.style.display !== "flex") {
        playSound(manSound);
      }
    }
  });
}

// Category Selection Modal Event Handlers
if (categoryCloseBtn) {
  categoryCloseBtn.addEventListener("click", closeCategoryModal);
}
if (cancelCategoryBtn) {
  cancelCategoryBtn.addEventListener("click", closeCategoryModal);
}
const categoryBackdrop = document.querySelector(".category-backdrop");
if (categoryBackdrop) {
  categoryBackdrop.addEventListener("click", closeCategoryModal);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && categoryModal && !categoryModal.classList.contains("hidden")) {
    closeCategoryModal();
  }
});

// Category Cards Click Handlers
categoryCards.forEach(card => {
  card.addEventListener("click", () => {
    ArcadeAudio.init();
    ArcadeAudio.click();
    categoryCards.forEach(c => c.classList.remove("active"));
    card.classList.add("active");
    selectedCategory = card.dataset.category;
    updateCategoryDisplay();
  });
});

// Modal Difficulty Buttons Click Handlers
modalDiffBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    ArcadeAudio.init();
    ArcadeAudio.click();
    modalDiffBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const newLvl = parseInt(btn.dataset.level, 10);
    setLevel(newLvl);
  });
});

// Start Battle from modal
if (startBattleBtn) {
  startBattleBtn.addEventListener("click", () => {
    startBattle();
  });
}

// Category badge in navbar - click to change category
if (categoryBadge) {
  categoryBadge.addEventListener("click", () => {
    if (!start.classList.contains("active") || stop.classList.contains("active") || (finalScore && finalScore.style.display === "flex")) {
      openCategoryModal();
    }
  });
}

// Initial game state setup
setButtonsDisabled(true);
updateQuestionProgress();
updateTimerDisplay();
updateCategoryDisplay();













