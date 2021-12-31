const usernameDiv = document.querySelector("#usernameDiv");
const roomIDDiv = document.querySelector("#roomIDDiv");
const newChatButton = document.querySelector("#newChat");
const joinWithIDButton = document.querySelector("#joinWithID");

newChatButton.addEventListener("click", () => {
  usernameDiv.classList.toggle("d-none");
  document.querySelector("#inputUsername1").focus();
});
joinWithIDButton.addEventListener("click", () => {
  roomIDDiv.classList.toggle("d-none");
  document.querySelector("#inputUsername2").focus();
});
