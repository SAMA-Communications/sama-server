import User from '../models/user.js';
import { slice } from '../utils/req_res_utils.js';
import { readJson } from './helpers/json_helper.js';

export default function routes(app) {
  // curl -X POST http://localhost:9001/users -H 'Content-Type: application/json' -d '{"login":"my_login","password":"my_password"}'
  app.post('/users', async (res, req) => {

    const obj = await readJson(res);
    const allowedFields = ['login', 'password'];
    const userParams = slice(obj, allowedFields);

    const user = new User(userParams);
    await user.save();

    res.writeStatus('201 OK').writeHeader("Content-Type", "application/json").end(user.toJSON());
  }).post('/users/login', (res, req) => {

  }).post('/users/logout', (res, req) => {
  
  });
}