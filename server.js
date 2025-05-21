const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static("public"));

let players = {};
let currentQuestionIndex = 0;
let answers = {};
let gameStarted = false;

const questions = [
  { question: "Capital of France?", options: ["Paris", "London", "Berlin", "Madrid"], answer: 0 },
  { question: "Red planet?", options: ["Earth", "Mars", "Jupiter", "Venus"], answer: 1 },
  { question: "HTML stands for?", options: ["HyperText", "Home Tool", "Hyper Transfer", "None"], answer: 0 },
  { question: "Which has rings?", options: ["Earth", "Venus", "Saturn", "Mars"], answer: 2 },
  { question: "7 x 8?", options: ["56", "58", "60", "62"], answer: 0 },
  { question: "Largest ocean?", options: ["Indian", "Pacific", "Atlantic", "Arctic"], answer: 1 },
  { question: "Fastest land animal?", options: ["Cheetah", "Lion", "Tiger", "Leopard"], answer: 0 },
];

function sendQuestion() {
  if (currentQuestionIndex >= questions.length) {
    io.emit("gameOver", players);
    gameStarted = false;
    return;
  }

  const q = questions[currentQuestionIndex];
  answers = {};
  io.emit("question", {
    question: q.question,
    options: q.options,
    index: currentQuestionIndex
  });
}

function evaluateAnswers() {
  const correct = questions[currentQuestionIndex].answer;

  for (let id in answers) {
    if (answers[id] === correct) {
      players[id].score += 1;
    }
  }

  io.emit("answerResult", {
    correctAnswer: correct,
    players
  });

  currentQuestionIndex++;
  setTimeout(sendQuestion, 3000);
}

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);
  players[socket.id] = { score: 0, name: "Anonymous" };

  // Register player name
  socket.on("registerName", (name) => {
    if (players[socket.id]) {
      players[socket.id].name = name || "Anonymous";
    }

    // Start game if enough players
    if (Object.keys(players).length >= 2 && !gameStarted) {
      gameStarted = true;
      currentQuestionIndex = 0;
      for (let id in players) players[id].score = 0;
      sendQuestion();
    }
  });

  socket.on("answer", (index) => {
    if (!(socket.id in answers)) {
      answers[socket.id] = index;

      if (Object.keys(answers).length === Object.keys(players).length) {
        evaluateAnswers();
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
    delete players[socket.id];

    if (Object.keys(players).length === 0) {
      currentQuestionIndex = 0;
      gameStarted = false;
    }
  });
});

server.listen(3000, () => {
  console.log("Server running on http://192.168.1.42:3000");
});
