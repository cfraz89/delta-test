import { say } from "cowsay2";

export const handler = async () => {
  return {
    status: 200,
    body: say("super go go go"),
  };
};
