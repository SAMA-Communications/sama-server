import User from "./../app/models/user.js";
import Contact from "./../app/models/contact.js";
import assert from "assert";
import { connectToDBPromise } from "./../app/lib/db.js";
import { createUserArray, mockedWS, sendLogin } from "./utils.js";
import { default as PacketProcessor } from "./../app/routes/packet_processor.js";

let usersIds = [];
let contactIdToUpdate = "";
let updatedAtParam = "";
let currentUserToken = "";

describe("Contacts functions", async () => {
  before(async () => {
    await connectToDBPromise();
    usersIds = await createUserArray(4);

    currentUserToken = await sendLogin(mockedWS, "user_1");
  });

  describe("Contact add", async () => {
    it("should work", async () => {
      const requestData = {
        request: {
          contact_add: {
            first_name: "Name",
            last_name: "Surname",
            company: "UserCompany",
            email: [{ type: "work", value: "412" }],
            phone: [{ type: "home", value: "543" }],
          },
          id: "1",
        },
      };

      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.equal(responseData.response.error, undefined);
      assert.equal(
        responseData.response.contact.first_name,
        requestData.request.contact_add.first_name
      );
      assert.equal(
        responseData.response.contact.last_name,
        requestData.request.contact_add.last_name
      );
      assert.equal(
        responseData.response.contact.company,
        requestData.request.contact_add.company
      );
      assert.equal(
        responseData.response.contact.name,
        requestData.request.contact_add.name
      );
    });

    it("should work matched_email", async () => {
      const requestData = {
        request: {
          contact_add: {
            first_name: "Name1",
            last_name: "Surname1",
            company: "UserCompany1",
            email: [{ type: "work", value: "email_1" }],
          },
          id: "1",
        },
      };

      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );
      contactIdToUpdate = responseData.response.contact._id;

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.equal(responseData.response.error, undefined);
      assert.equal(
        responseData.response.contact.first_name,
        requestData.request.contact_add.first_name
      );
      assert.equal(
        responseData.response.contact.last_name,
        requestData.request.contact_add.last_name
      );
      assert.equal(
        responseData.response.contact.company,
        requestData.request.contact_add.company
      );
      assert.equal(
        responseData.response.contact.name,
        requestData.request.contact_add.name
      );
      assert.equal(
        responseData.response.contact.email[0].matched_user_id.toString(),
        usersIds[1].toString()
      );
    });

    it("should fail name is missed", async () => {
      const requestData = {
        request: {
          contact_add: {
            company: "UserCompany2",
            phone: [{ type: "work", value: "phone_2" }],
          },
          id: "1",
        },
      };

      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Name is missed",
      });
    });

    it("should fail email or phone is missed", async () => {
      const requestData = {
        request: {
          contact_add: {
            first_name: "Name1",
            last_name: "Surname1",
            company: "UserCompany1",
          },
          id: "1",
        },
      };

      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Email or phone is missed",
      });
    });
  });

  describe("Contact batch add", async () => {
    it("should work", async () => {
      const requestData = {
        request: {
          contact_batch_add: {
            contacts: [
              {
                first_name: "Name11",
                last_name: "Surname11",
                company: "UserCompany",
                email: [{ type: "work", value: "412" }],
                phone: [{ type: "home", value: "543" }],
              },
              {
                first_name: "Name22",
                last_name: "Surname22",
                company: "UserCompany",
                email: [{ type: "work", value: "412" }],
                phone: [{ type: "home", value: "phone_2" }],
              },
              {
                first_name: "Name33",
                last_name: "Surname33",
                company: "UserCompany",
                email: [{ type: "work", value: "email_3" }],
                phone: [{ type: "home", value: "543" }],
              },
            ],
          },
          id: "1",
        },
      };

      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );
      updatedAtParam = responseData.response.contacts[0].updated_at;

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.equal(responseData.response.error, undefined);
      assert.equal(responseData.response.contacts.length, 3);
      assert.equal(
        responseData.response.contacts[2].email[0].matched_user_id.toString(),
        usersIds[3].toString()
      );
      assert.equal(
        responseData.response.contacts[1].phone[0].matched_user_id.toString(),
        usersIds[2].toString()
      );
    });

    it("should fail phone or email is missed", async () => {
      const requestData = {
        request: {
          contact_batch_add: {
            contacts: [
              {
                first_name: "Name11",
                last_name: "Surname11",
                company: "UserCompany",
              },
            ],
          },
          id: "1",
        },
      };

      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Email or phone is missed",
      });
    });

    it("should fail name is missed", async () => {
      const requestData = {
        request: {
          contact_batch_add: {
            contacts: [
              {
                email: [{ type: "work", value: "email_3" }],
                phone: [{ type: "home", value: "543" }],
              },
            ],
          },
          id: "1",
        },
      };

      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Name is missed",
      });
    });
  });

  describe("Contact update", async () => {
    it("should work", async () => {
      const requestData = {
        request: {
          contact_update: {
            id: contactIdToUpdate.toString(),
            first_name: "Updated_name",
            last_name: "Updated_surname",
            company: "newCompany",
            email: [{ type: "work", value: "email_2" }],
            phone: [{ type: "home", value: "phone_3" }],
          },
          id: "1",
        },
      };

      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.equal(responseData.response.error, undefined);
      assert.equal(
        responseData.response.contact.first_name,
        requestData.request.contact_update.first_name
      );
      assert.equal(
        responseData.response.contact.last_name,
        requestData.request.contact_update.last_name
      );
      assert.equal(
        responseData.response.contact.company,
        requestData.request.contact_update.company
      );
      assert.equal(
        responseData.response.contact.email[0].matched_user_id.toString(),
        usersIds[2].toString()
      );
      assert.equal(
        responseData.response.contact.phone[0].matched_user_id.toString(),
        usersIds[3].toString()
      );
    });

    it("should fail id not found", async () => {
      const requestData = {
        request: {
          contact_update: {
            id: "123",
            first_name: "Updated_name",
            last_name: "Updated_surname",
            company: "newCompany",
            email: [{ type: "work", value: "email_2" }],
            phone: [{ type: "home", value: "phone_3" }],
          },
          id: "1",
        },
      };

      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "User not found",
      });
    });

    it("should fail id is missed", async () => {
      const requestData = {
        request: {
          contact_update: {
            first_name: "Updated_name",
            last_name: "Updated_surname",
            company: "newCompany",
            email: [{ type: "work", value: "email_2" }],
            phone: [{ type: "home", value: "phone_3" }],
          },
          id: "1",
        },
      };

      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Contact id is missed",
      });
    });
  });

  describe("Contact list", async () => {
    it("should work", async () => {
      const requestData = {
        request: {
          contact_list: {},
          id: "1",
        },
      };

      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.equal(responseData.response.error, undefined);
      assert.equal(responseData.response.contacts.length, 5);
      assert.equal(
        responseData.response.contacts[0].user_id.toString(),
        usersIds[0].toString()
      );
      assert.equal(
        responseData.response.contacts[1].user_id.toString(),
        usersIds[0].toString()
      );
      assert.equal(
        responseData.response.contacts[2].user_id.toString(),
        usersIds[0].toString()
      );
      assert.equal(
        responseData.response.contacts[3].user_id.toString(),
        usersIds[0].toString()
      );
      assert.equal(
        responseData.response.contacts[4].user_id.toString(),
        usersIds[0].toString()
      );
    });

    it("should work limit param", async () => {
      const requestData = {
        request: {
          contact_list: {
            limit: 3,
          },
          id: "1",
        },
      };

      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.equal(responseData.response.error, undefined);
      assert.equal(responseData.response.contacts.length, 3);
      assert.equal(
        responseData.response.contacts[0].user_id.toString(),
        usersIds[0].toString()
      );
      assert.equal(
        responseData.response.contacts[1].user_id.toString(),
        usersIds[0].toString()
      );
      assert.equal(
        responseData.response.contacts[2].user_id.toString(),
        usersIds[0].toString()
      );
    });

    it("should work updated_at param", async () => {
      const requestData = {
        request: {
          contact_list: {
            updated_at: updatedAtParam,
          },
          id: "1",
        },
      };

      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.equal(responseData.response.error, undefined);
      assert.equal(responseData.response.contacts.length, 2);
      assert.equal(
        responseData.response.contacts[0].user_id.toString(),
        usersIds[0].toString()
      );
      assert.equal(
        responseData.response.contacts[1].user_id.toString(),
        usersIds[0].toString()
      );
    });
  });

  describe("Contact delete", async () => {
    it("should work", async () => {
      const requestData = {
        request: {
          contact_delete: {
            id: contactIdToUpdate.toString(),
          },
          id: "1",
        },
      };

      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.equal(responseData.response.error, undefined);
      assert.equal(responseData.response.success, true);
    });

    it("should fail id is missed", async () => {
      const requestData = {
        request: {
          contact_delete: {},
          id: "1",
        },
      };

      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Contact id is missed",
      });
    });

    it("should work list", async () => {
      const requestData = {
        request: {
          contact_list: {},
          id: "1",
        },
      };

      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.equal(responseData.response.error, undefined);
      assert.equal(responseData.response.contacts.length, 4);
    });
  });

  after(async () => {
    await User.clearCollection();
    await Contact.clearCollection();
    usersIds = [];
  });
});
