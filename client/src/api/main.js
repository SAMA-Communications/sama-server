import AuthApi from './auth';
import ChatApi from './chat';

// TODO: move ot env
const BASE_URL = "http://localhost:9001"

export default {
  auth: new AuthApi(BASE_URL),
  chat: new ChatApi(BASE_URL)
}