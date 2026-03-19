import { hash } from "bcryptjs";

export async function hashPassword(password: string) {
  return hash(password, 10);
}
