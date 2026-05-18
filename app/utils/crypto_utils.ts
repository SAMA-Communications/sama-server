import crypto from "node:crypto"

const STRETCHES = 20

export type HashedPassword = {
  salt: string
  encryptedPassword: string
}

export function generateSalt(length: number = 20): string {
  const rlength = (length * 3) / 4
  let result = crypto.randomBytes(rlength).toString("base64")
  result = result.replace("l", "s").replace("I", "x").replace("O", "y").replace("0", "z")
  return result
}

export async function hashPassword(plainPassword: string, salt: string = generateSalt()): Promise<HashedPassword> {
  // https://codereview.stackexchange.com/a/15635/227555

  let encryptedPassword = plainPassword + salt
  for (let i = 0; i < STRETCHES; ++i) {
    const hash = crypto.createHash("sha512")
    hash.update(encryptedPassword)
    encryptedPassword = hash.digest("hex")
  }

  return {
    salt,
    encryptedPassword,
  }
}

export async function verifyPassword(plainPassword: string, encryptedPassword: string, salt: string): Promise<boolean> {
  const res = await hashPassword(plainPassword, salt)
  return encryptedPassword === res.encryptedPassword
}
