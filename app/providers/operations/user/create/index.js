import { ERROR_STATUES } from '../../../../constants/errors.js'

class UserCreateOperation {
  constructor(userService, contactsMatchRepository) {
    this.userService = userService
    this.contactsMatchRepository = contactsMatchRepository
  }

  async perform (createUserParams) {
    const existingUser = await this.userService.userRepo.findRegistered(createUserParams.login, createUserParams.email, createUserParams.phone)

    if (existingUser) {
      throw new Error(ERROR_STATUES.USER_ALREADY_EXISTS.message, {
        cause: ERROR_STATUES.USER_ALREADY_EXISTS,
      })
    }

    const createdUser = await this.userService.create(createUserParams)

    await this.contactsMatchRepository.matchUserWithContactOnCreate(
      createdUser.params._id.toString(),
      createdUser.params.phone,
      createdUser.params.email
    )

    return createdUser
  }
}

export default UserCreateOperation
