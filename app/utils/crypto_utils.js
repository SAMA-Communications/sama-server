import crypto from 'crypto'

const STRETCHES = 20

export function generateSalt(length = 20) {
  const rlength = (length * 3) / 4
  let result = crypto.randomBytes(rlength).toString('base64')
  result = result.replace('l', 's').replace('I', 'x').replace('O', 'y').replace('0', 'z')
  return result
}

export async function hashPassword(plainPassword, salt = generateSalt()) {
  // https://codereview.stackexchange.com/a/15635/227555

  let encryptedPassword = plainPassword + salt
  for (let i = 0; i < STRETCHES; ++i) {
    const hash = crypto.createHash('sha512')
    hash.update(encryptedPassword)
    encryptedPassword = hash.digest('hex')
  }

  return {
    salt,
    encryptedPassword
  }
}

export async function verifyPassword(plainPassword, encryptedPassword, salt) {
  const res = await hashPassword(plainPassword, salt)
  return encryptedPassword === res.encryptedPassword
}
