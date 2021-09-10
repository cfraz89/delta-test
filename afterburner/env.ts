import { STS } from "@aws-sdk/client-sts";

async function getUserEnv() {
  const identityArn = (await new STS({}).getCallerIdentity({})).Arn;
  const env = identityArn ? identityArn.split("/")[1] : "default";
  return env;
}

export async function resolveEnv() {
  const env = process.env.AFTERBURNER_ENV ?? (await getUserEnv());
  return (id: string) => `${env}-${id}`;
}
