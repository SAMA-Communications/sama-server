import BaseJSONController from "./base.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import Response from "@sama/networking/models/Response.js"

class ContactsController extends BaseJSONController {
  async contact_add(ws, data) {
    const { id: requestId, contact_add: contactData } = data

    const contactAddOperation = ServiceLocatorContainer.use("ContactAddOperation")

    const contact = await contactAddOperation.perform(ws, contactData, false)

    return new Response().addBackMessage({ response: { id: requestId, contact: contact.visibleParams() } })
  }

  async contact_batch_add(ws, data) {
    const {
      id: requestId,
      contact_batch_add: { contacts },
    } = data

    const contactAddOperation = ServiceLocatorContainer.use("ContactAddOperation")

    const contactsList = await contactAddOperation.perform(ws, contacts, true)

    return new Response().addBackMessage({ response: { id: requestId, contacts: contactsList } })
  }

  async contact_update(ws, data) {
    const { id: requestId, contact_update: updatedData } = data

    const contactEditOperation = ServiceLocatorContainer.use("ContactEditOperation")

    const updatedContact = await contactEditOperation.perform(ws, updatedData)

    return new Response().addBackMessage({ response: { id: requestId, contact: updatedContact } })
  }

  async contact_list(ws, data) {
    const { id: requestId, contact_list: query } = data

    const contactListOperation = ServiceLocatorContainer.use("ContactListOperation")

    const contacts = await contactListOperation.perform(ws, query)

    return new Response().addBackMessage({ response: { id: requestId, contacts } })
  }

  async contact_delete(ws, data) {
    const { id: requestId, contact_delete } = data

    const contactDeleteOperation = ServiceLocatorContainer.use("ContactDeleteOperation")

    await contactDeleteOperation.perform(ws, contact_delete)

    return new Response().addBackMessage({ response: { id: requestId, success: true } })
  }
}

export default new ContactsController()
