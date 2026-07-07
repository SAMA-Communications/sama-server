import { ERROR_STATUES } from "../../../../constants/errors.js"

class UserCreateOperation {
  constructor(organizationService, userService, contactsMatchRepository) {
    this.organizationService = organizationService
    this.userService = userService
    this.contactsMatchRepository = contactsMatchRepository
  }

  async perform(createUserParams) {
    const isOrgExist = await this.organizationService.isExist(createUserParams.organization_id)

    if (!isOrgExist) {
      throw new Error(ERROR_STATUES.ORG_NOT_FOUND.message, {
        cause: ERROR_STATUES.ORG_NOT_FOUND,
      })
    }

    const blockStatus = await this.organizationService.isUserFromBlocked(createUserParams)

    if (blockStatus.isBlocked) {
      throw new Error(ERROR_STATUES.ORGANIZATION_BLOCKED.message, {
        cause: Object.assign({}, blockStatus, ERROR_STATUES.ORGANIZATION_BLOCKED),
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
