import { say } from "cowsay2";

export const handler = async () => {
  console.log("Logging this");
  return {
    status: 200,
    body: say("super go go go"),
  };
};
