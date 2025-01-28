export default function extractRefreshTokenFromCookie(cookieHeader) {
  return cookieHeader
    ? cookieHeader
        .split("; ")
        .find((cookie) => cookie.startsWith("refresh_token="))
        ?.split("=")[1]
    : null
}
