
const display = document.getElementById("display");
const buttons = document.querySelectorAll("button");
const historyList = document.getElementById("history-list");

// Load history from localStorage
window.onload = () => {
  const savedHistory = JSON.parse(localStorage.getItem("calc-history")) || [];
  savedHistory.forEach(addToHistory);
};

buttons.forEach(button => {
  button.addEventListener("click", () => {
    const value = button.textContent;

    if (value === "C") {
      display.value = "";
      return;
    }

    if (value === "=") {
      try {
        const result = eval(display.value);
        const expression = display.value + " = " + result;
        addToHistory(expression, true);
        display.value = result;
      } catch (err) {
        display.value = "Error";
      }
      return;
    }

    const operators = "+-*/%";
    const lastChar = display.value.slice(-1);

    if (operators.includes(value) && operators.includes(lastChar)) return;

    display.value += value;
  });
});

function addToHistory(entry, save = false) {
  const li = document.createElement("li");
  li.textContent = entry;
  historyList.prepend(li);

  if (save) {
    const currentHistory = JSON.parse(localStorage.getItem("calc-history")) || [];
    currentHistory.unshift(entry);
    localStorage.setItem("calc-history", JSON.stringify(currentHistory.slice(0, 50)));
  }
}