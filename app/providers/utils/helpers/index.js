class Helpers {
  getDisplayName(user) {
    return user.first_name || user.last_name
      ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
      : user.login
  }
}

export default Helpers