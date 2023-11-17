import User from "./../app/models/user.js";
import Contact from "./../app/models/contact.js";
import assert from "assert";
import { connectToDBPromise } from "./../app/lib/db.js";
import { createUserArray, mockedWS, sendLogin, sendLogout } from "./utils.js";
import packetJsonProcessor from "../APIs/JSON/routes/packet_processor.js";

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

      const responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
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

      const responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
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

      const responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "'first_name' or 'last_name' is missed.",
      });
    });

    it("should fail Email or phone is missed.", async () => {
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

      const responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Email or phone is missed.",
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

      const responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
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

      const responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Email or phone is missed.",
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

      const responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "'first_name' or 'last_name' is missed.",
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

      const responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
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
            id: "123zxc",
            first_name: "Updated_name",
            last_name: "Updated_surname",
            company: "newCompany",
            email: [{ type: "work", value: "email_2" }],
            phone: [{ type: "home", value: "phone_3" }],
          },
          id: "1",
        },
      };

      const responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Contact not found.",
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

      const responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Contact id is missed.",
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

      const responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
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

      const responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
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

      const responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
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

      const responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
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

      const responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Contact id is missed.",
      });
    });

    it("should work list", async () => {
      const requestData = {
        request: {
          contact_list: {},
          id: "1",
        },
      };

      const responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.equal(responseData.response.error, undefined);
      assert.equal(responseData.response.contacts.length, 4);
    });
  });

  describe("Contact mathced", async () => {
    it("should work user_create", async () => {
      let requestData = {
        request: {
          contact_batch_add: {
            contacts: [
              {
                first_name: "Name11_5",
                last_name: "Surname11_5",
                company: "UserCompany",
                email: [{ type: "work", value: "test_matched_5_email" }],
                phone: [{ type: "home", value: "test_5_phone" }],
              },
              {
                first_name: "Name22_5",
                last_name: "Surname22_5",
                company: "UserCompany",
                email: [{ type: "work", value: "test_matched_5_email" }],
                phone: [{ type: "home", value: "test_5_phone" }],
              },
              {
                first_name: "Name33_5",
                last_name: "Surname33_5",
                company: "UserCompany",
                email: [{ type: "work", value: "test_matched_5_email" }],
                phone: [{ type: "home", value: "test_5_phone" }],
              },
            ],
          },
          id: "1",
        },
      };

      let responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      usersIds = [
        ...usersIds,
        (
          await createUserArray(1, 5, "test_matched_5_email", "test_5_phone")
        )[5],
      ];
      requestData = {
        request: {
          contact_list: {},
          id: "1",
        },
      };

      responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(
        responseData.response.contacts[0].email[0].matched_user_id.toString(),
        usersIds[4].toString()
      );
      assert.strictEqual(
        responseData.response.contacts[1].email[0].matched_user_id.toString(),
        usersIds[4].toString()
      );
      assert.strictEqual(
        responseData.response.contacts[2].email[0].matched_user_id.toString(),
        usersIds[4].toString()
      );
      assert.strictEqual(
        responseData.response.contacts[0].phone[0].matched_user_id.toString(),
        usersIds[4].toString()
      );
      assert.strictEqual(
        responseData.response.contacts[1].phone[0].matched_user_id.toString(),
        usersIds[4].toString()
      );
      assert.strictEqual(
        responseData.response.contacts[2].phone[0].matched_user_id.toString(),
        usersIds[4].toString()
      );
    });

    it("should work user_edit", async () => {
      let requestData = {
        request: {
          contact_batch_add: {
            contacts: [
              {
                first_name: "Name11_6",
                last_name: "Surname11_6",
                company: "UserCompany",
                email: [{ type: "work", value: "testmatched6@email.com" }],
                phone: [{ type: "home", value: "test_6_phone" }],
              },
              {
                first_name: "Name22_6",
                last_name: "Surname22_6",
                company: "UserCompany",
                email: [{ type: "work", value: "testmatched6@email.com" }],
                phone: [{ type: "home", value: "test_6_phone" }],
              },
              {
                first_name: "Name33_6",
                last_name: "Surname33_6",
                company: "UserCompany",
                email: [{ type: "work", value: "testmatched6@email.com" }],
                phone: [{ type: "home", value: "test_6_phone" }],
              },
            ],
          },
          id: "1",
        },
      };

      let responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      await sendLogout(mockedWS, currentUserToken);
      currentUserToken = await sendLogin(mockedWS, "user_4");
      requestData = {
        request: {
          user_edit: {
            email: "testmatched6@email.com",
            phone: "test_6_phone",
          },
          id: "1",
        },
      };

      responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );
      await sendLogout(mockedWS, currentUserToken);
      currentUserToken = await sendLogin(mockedWS, "user_1");

      requestData = {
        request: {
          contact_list: {},
          id: "1",
        },
      };

      responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );
      console.log(responseData.response.contacts[0]);

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(
        responseData.response.contacts[0].email[0].matched_user_id.toString(),
        usersIds[3].toString()
      );
      assert.strictEqual(
        responseData.response.contacts[1].email[0].matched_user_id.toString(),
        usersIds[3].toString()
      );
      assert.strictEqual(
        responseData.response.contacts[2].email[0].matched_user_id.toString(),
        usersIds[3].toString()
      );
      assert.strictEqual(
        responseData.response.contacts[0].phone[0].matched_user_id.toString(),
        usersIds[3].toString()
      );
      assert.strictEqual(
        responseData.response.contacts[1].phone[0].matched_user_id.toString(),
        usersIds[3].toString()
      );
      assert.strictEqual(
        responseData.response.contacts[2].phone[0].matched_user_id.toString(),
        usersIds[3].toString()
      );
    });
  });

  describe("Contact unmatched", async () => {
    it("should work email", async () => {
      await sendLogout(mockedWS, currentUserToken);
      currentUserToken = await sendLogin(mockedWS, "user_4");
      let requestData = {
        request: {
          user_edit: {
            email: "testmatched7@email.com",
          },
          id: "1",
        },
      };

      let responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );
      await sendLogout(mockedWS, currentUserToken);
      currentUserToken = await sendLogin(mockedWS, "user_1");

      requestData = {
        request: {
          contact_list: {},
          id: "1",
        },
      };

      responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(
        responseData.response.contacts[0].email[0].value,
        "testmatched7@email.com"
      );
      assert.strictEqual(
        responseData.response.contacts[1].email[0].value,
        "testmatched7@email.com"
      );
      assert.strictEqual(
        responseData.response.contacts[2].email[0].value,
        "testmatched7@email.com"
      );
      assert.strictEqual(
        responseData.response.contacts[0].email[0].matched_user_id,
        usersIds[3].toString()
      );
      assert.strictEqual(
        responseData.response.contacts[1].email[0].matched_user_id,
        usersIds[3].toString()
      );
      assert.strictEqual(
        responseData.response.contacts[2].email[0].matched_user_id,
        usersIds[3].toString()
      );
      assert.strictEqual(
        responseData.response.contacts[0].phone[0].matched_user_id.toString(),
        usersIds[3].toString()
      );
      assert.strictEqual(
        responseData.response.contacts[1].phone[0].matched_user_id.toString(),
        usersIds[3].toString()
      );
      assert.strictEqual(
        responseData.response.contacts[2].phone[0].matched_user_id.toString(),
        usersIds[3].toString()
      );
    });

    it("should work phone", async () => {
      await sendLogout(mockedWS, currentUserToken);
      currentUserToken = await sendLogin(mockedWS, "user_4");
      let requestData = {
        request: {
          user_edit: {
            phone: "123ax",
          },
          id: "1",
        },
      };

      let responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );
      await sendLogout(mockedWS, currentUserToken);
      currentUserToken = await sendLogin(mockedWS, "user_1");

      requestData = {
        request: {
          contact_list: {},
          id: "1",
        },
      };

      responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(
        responseData.response.contacts[0].phone[0].value,
        "123ax"
      );
      assert.strictEqual(
        responseData.response.contacts[1].phone[0].value,
        "123ax"
      );
      assert.strictEqual(
        responseData.response.contacts[2].phone[0].value,
        "123ax"
      );
      assert.strictEqual(
        responseData.response.contacts[0].phone[0].matched_user_id,
        usersIds[3].toString()
      );
      assert.strictEqual(
        responseData.response.contacts[1].phone[0].matched_user_id,
        usersIds[3].toString()
      );
      assert.strictEqual(
        responseData.response.contacts[2].phone[0].matched_user_id,
        usersIds[3].toString()
      );
    });

    it("should work delete user", async () => {
      await sendLogout(mockedWS, currentUserToken);
      currentUserToken = await sendLogin(mockedWS, "user_6");
      let requestData = {
        request: {
          user_delete: {},
          id: "1",
        },
      };

      let responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      currentUserToken = await sendLogin(mockedWS, "user_1");
      requestData = {
        request: {
          contact_list: {},
          id: "1",
        },
      };

      responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(
        responseData.response.contacts[3].phone[0].matched_user_id,
        undefined
      );
      assert.strictEqual(
        responseData.response.contacts[4].phone[0].matched_user_id,
        undefined
      );
      assert.strictEqual(
        responseData.response.contacts[5].phone[0].matched_user_id,
        undefined
      );
      assert.strictEqual(
        responseData.response.contacts[3].email[0].matched_user_id,
        undefined
      );
      assert.strictEqual(
        responseData.response.contacts[4].email[0].matched_user_id,
        undefined
      );
      assert.strictEqual(
        responseData.response.contacts[5].email[0].matched_user_id,
        undefined
      );
    });
  });

  after(async () => {
    await User.clearCollection();
    await Contact.clearCollection();
    usersIds = [];
  });
});
