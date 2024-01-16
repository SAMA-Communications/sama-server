export default function getDisplayName(u) {
  return u.first_name || u.last_name
    ? `${u.first_name || ''} ${u.last_name || ''}`.trim()
    : u.login
}