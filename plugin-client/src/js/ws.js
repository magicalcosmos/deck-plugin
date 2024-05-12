window.WS = function (url, uuid) {
  const _this = this;
  this.url = url;
  this.uuid = uuid;
  this.ws = null;
  this.key = '';

  this.onOpenParams = null;
  /**
   * 获取websocket消息，用于自定义
   */
  this.onmessage = function() {};

  /**
   * 错误消息处理，上位机reason替代方法
   * @param evt 错误信息
   * @returns 错误信息字符串
   */
  this.getReason = function(evt) {
    return JSON.stringify(evt);
  };

  /**
   * webscoket send
   * @param data 数据
   */
  this.send = function(data) {
    const params = Object.assign({ uuid: _this.uuid }, data);
    _this.ws && _this.ws.send(JSON.stringify(params));
  };

  /**
   * 初始化
   */
  this.start = function() {
    _this.ws = new WebSocket(_this.url);
    /**
     * webscoket 打开链接
     * @param data 数据
     */
    _this.ws.onopen = function() {
      const data = {
        code: 0,
        cmd: 'connected',
        uuid: _this.uuid,
      };
      _this.send(_this.onOpenParams || data);
    };

    /**
     * webscoket 接收消息
     * @param json 数据
     */
    _this.ws.onmessage = function(evt) {
      const jsonObj = JSON.parse(evt.data);
      _this.onmessage(jsonObj);
    };

    /**
     * webscoket 关闭链接
     * @param json 数据
     */
    _this.ws.onclose = function(evt) {
      document.getElementById('msgId0').innerHTML = Date.now();
      const timeout = setTimeout(() => {
        timeout && clearTimeout(timeout);
        _this.start();
      }, 400);
        // const reason = _this.getReason(evt);
        // console.warn('[STREAMDECK]***** WEBOCKET CLOSED **** reason:', reason);
    }
  };
}