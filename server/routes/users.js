import User from '../models/user.js';
import UserSession from '../models/user_session.js';
import { slice } from '../utils/req_res_utils.js';
import { readJson } from './helpers/json_helper.js';

export default function routes(app) {
  // curl -X POST http://localhost:9001/users -H 'Content-Type: application/json' -d '{"login":"my_login22","password":"my_password"}' -v
  app.post('/users', async (res, req) => {

    const reqParams = await readJson(res);
    const allowedFields = ['login', 'password'];
    const userParams = slice(reqParams, allowedFields);

    const user = new User(userParams);
    await user.save();

    res.writeStatus('201 Created').writeHeader("Content-Type", "application/json").end(user.toJSON());

  // curl -X POST http://localhost:9001/users/login -H 'Content-Type: application/json' -d '{"login":"my_login22","password":"my_password"}' -v
  }).post('/users/login', async (res, req) => {

    const reqParams = await readJson(res);

    const user = await User.findOne({ login: reqParams.login });
    if (!user) {
      res.writeStatus('401 Unauthorized').end();
      return;
    }

    if (!await user.isValidPassword(reqParams.password)) {
      res.writeStatus('401 Unauthorized').end();
      return;
    }

    const userSession = new UserSession({user_id: user.params._id});
    await userSession.save();

    const respData = {
      token: userSession.params._id,
      user: user.visibleParams()
    }

    res.writeStatus('200 OK').writeHeader("Content-Type", "application/json").end(JSON.stringify(respData));

  // curl -X POST http://localhost:9001/users/logout -H 'Content-Type: application/json' -H 'token: 624458cb784b8fbddda25564' -v
  }).post('/users/logout', async (res, req) => {
    res.onAborted(() => {
      res.aborted = true;
    });

    const token = req.getHeader("token");

    const userSession = await UserSession.findOne({ _id: token});
    if (userSession) {
      await userSession.delete();
    }

    if (!res.aborted) {
      res.writeStatus('200 OK').end();
    }
  });
}