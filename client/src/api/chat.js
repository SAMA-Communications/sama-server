import BaseApi from './base/base';

export default class ChatApi extends BaseApi {
  constructor(baseUrl) {
    super(baseUrl);

    this.socket = null;
  }

  async connect() {
    this.socket = new WebSocket(this.baseUrl);

    this.socket.onopen = () => {
      console.log("[socket.onopen]");
    };

    this.socket.onmessage = (e) => {
      console.log("[socket.onmessage]", e.data);
      // setMessages([...messagesRef.current, e.data]);
    };

    this.socket.onclose = () => {
      console.log("[socket.onclose]");
    }
  }

  async login(params) {

  }

  sendMessage(message) {
  
  }
}