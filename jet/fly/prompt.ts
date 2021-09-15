import chalk from "chalk";

export function usagePrompt() {
  console.info(chalk.yellowBright(chalk.bgBlack("d: Redeploy\tx: Exit")));
}
