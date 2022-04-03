import UserSession from '../models/user_session.js';

import { StringDecoder } from 'string_decoder';
const decoder = new StringDecoder('utf8');

const ACTIVE_SESSIONS = {};

export default function routes(app, wsOptions) {
  app.ws('/*', {
    ...wsOptions,
  
    open: (ws) => {
      console.log('[open]', `IP: ${Buffer.from(ws.getRemoteAddressAsText()).toString()}`);  
      ws.send('connected');
    },
  
    close: (ws, code, message) => {
      delete ACTIVE_SESSIONS[ws];
    },
  
    message: async (ws, message, isBinary) => {
      const json = JSON.parse(decoder.write(Buffer.from(message)));
      console.log('[message]', json);

      if (json.auth) {
        const { token } = json.auth;

        const userSession = await UserSession.findOne({ _id: token });
        if (!userSession) {
          ws.send(JSON.stringify({auth: {result: "error", error: "401 Unauthorized"}}));
          return;
        }

        ACTIVE_SESSIONS[ws] = {userSession: userSession.params};

        ws.send(JSON.stringify({auth: {result: "success"}}));
      } else if (json.message) {
        if (!ACTIVE_SESSIONS[ws]) {
          ws.send(JSON.stringify({message: {result: "error", error: "401 Unauthorized"}}));
        }

        ws.send(json);
      }
    }
  })
}