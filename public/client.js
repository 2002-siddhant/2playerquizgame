
const socket = io();

const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const scoreboardEl = document.getElementById("scoreboard");

let answered = false;

// Prompt player name and send it to the server
const name = prompt("Enter your name:");
socket.emit("registerName", name);

socket.on("question", (data) => {
  questionEl.textContent = data.question;
  optionsEl.innerHTML = "";
  answered = false;

  data.options.forEach((opt, idx) => {
    const btn = document.createElement("div");
    btn.textContent = opt;
    btn.className = "option";
    btn.onclick = () => {
      if (!answered) {
        socket.emit("answer", idx);
        answered = true;
        document.querySelectorAll(".option").forEach(opt => opt.style.pointerEvents = "none");
      }
    };
    optionsEl.appendChild(btn);
  });
});

socket.on("answerResult", ({ correctAnswer, players }) => {
  document.querySelectorAll(".option").forEach((opt, i) => {
    opt.classList.remove("correct", "incorrect");
    if (i === correctAnswer) {
      opt.classList.add("correct");
    } else {
      opt.classList.add("incorrect");
    }
  });

  let scores = "<h2>Scoreboard</h2>";
  for (let id in players) {
    const player = players[id];
    scores += `<div>${player.name || id.slice(0, 5)}: ${player.score}</div>`;
  }
  scoreboardEl.innerHTML = scores;
});

socket.on("gameOver", (players) => {
  questionEl.textContent = "Game Over!";
  optionsEl.innerHTML = "";
  let scores = "<h2>Final Scores</h2>";
  for (let id in players) {
    const player = players[id];
    scores += `<div>${player.name || id.slice(0, 5)}: ${player.score}</div>`;
  }
  scoreboardEl.innerHTML = scores;
});
