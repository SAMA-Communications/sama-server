export default function getUserName(u) {
  return u.first_name || u.last_name
    ? `${u.first_name || ""} ${u.last_name || ""}`.trim()
    : u.login;
}
