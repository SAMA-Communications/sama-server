import BaseMapper from "../base/index.js"

class UserMapper extends BaseMapper {
  mappedParams(record) {
    const mappedParams = {
      native_id: record._id,
    }

    return mappedParams
  }
}

export default UserMapper
