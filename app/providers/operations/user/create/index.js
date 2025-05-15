import { ERROR_STATUES } from "../../../../constants/errors.js"

class UserCreateOperation {
  constructor(orgService, userService, contactsMatchRepository) {
    this.orgService = orgService
    this.userService = userService
    this.contactsMatchRepository = contactsMatchRepository
  }

  async perform(createUserParams) {
    const isOrgExist = await this.orgService.isExist(createUserParams.organization_id)

    if (!isOrgExist) {
      throw new Error(ERROR_STATUES.ORG_NOT_FOUND.message, {
        cause: ERROR_STATUES.ORG_NOT_FOUND,
      })
    }

    const existingUser = await this.userService.userRepo.findRegistered(
      createUserParams.organization_id,
      createUserParams.login,
      createUserParams.email,
      createUserParams.phone
    )

    if (existingUser) {
      throw new Error(ERROR_STATUES.USER_ALREADY_EXISTS.message, {
        cause: ERROR_STATUES.USER_ALREADY_EXISTS,
      })
    }

    const createdUser = await this.userService.create(createUserParams)

    await this.contactsMatchRepository.matchUserWithContactOnCreate(
      createdUser.organization_id,
      createdUser.native_id,
      createdUser.phone,
      createdUser.email
    )

    return createdUser
  }
}

export default UserCreateOperation
