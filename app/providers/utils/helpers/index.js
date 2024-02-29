class Helpers {
  getDisplayName(user) {
    const userParams = user.params

    return userParams.first_name || userParams.last_name
      ? `${userParams.first_name || ''} ${userParams.last_name || ''}`.trim()
      : userParams.login
  }
}

export default Helpers