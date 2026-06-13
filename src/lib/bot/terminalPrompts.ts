const convertStringToBlue = (text: string) => `\x1B[3;34m${text}\x1B[0m`;

export const botPrompt = convertStringToBlue("aa_bot@ ankitesharora.com:~$ ");
export const visitorPrompt = convertStringToBlue(
  "visitor@ ankitesharora.com:~$ ",
);
