const createClassroomCode = (length) => {
  let chars = "abcdefghijklmnopqrstuvwxyz123456789";
  let codeArray = [];
  for (let i = 0; i < length; i++) {
    codeArray[i] = chars[Math.floor(Math.random() * 35)];
  }
  return codeArray.join("");
};
