class BaseMapper {
  createModelParams(record) {
    const params = this.params(record)
    const mappedParams = this.mappedParams(record)

    return { params, mappedParams }
  }

  params(record) {
    const params = {
      ...record
    }

    return params
  }

  mappedParams(record) {
    return {}
  }
}

export default BaseMapper