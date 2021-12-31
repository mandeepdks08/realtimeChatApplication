const randomRoomBtn = document.querySelector("#join-a-room");
const randomRoomForm = document.querySelector("#randomRoomForm");

randomRoomBtn.addEventListener("click", () => {
  const usernameRow = document.querySelector("#usernameRow");
  usernameRow.classList.toggle("d-none");
  randomRoomForm.elements.username.focus();
});

randomRoomForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const usernameInputElement = randomRoomForm.elements.username;
  if (usernameInputElement.value.length != 0) {
    randomRoomForm.submit();
  }
});
