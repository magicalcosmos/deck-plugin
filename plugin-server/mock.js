const Koa = require('koa');
const app = new Koa();
var WebSocket = require('ws');
const json = require('koa-json');
const onerror = require('koa-onerror');
const bodyparser = require('koa-bodyparser');
const logger = require('koa-logger');
var http = require('http');
const getImagePaths = require('./lib');
// error handler
onerror(app);
// 变量
const port = 3906;
const serverPort = 3906;
const uuid = 'com.ulanzi.ulanzideck.momentsslideshow.plugin';

let wsToPluginClient = null;
// middlewares
app.use(
  bodyparser({
    enableTypes: ['json', 'form', 'text'],
  })
);
app.use(json());
app.use(logger());
app.use(require('koa-static')(__dirname + '/public'));

// logger
app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx);
});

var server = http.createServer(app.callback());
// Start the server
server.listen(port, () => {
  console.log(`plugin服务已启动，监听端口：${port}`);
});
// 存储所有的 WebSocket 连接
const connections = [];
// 创建 WebSocket 服务器与插件链接
const wss = new WebSocket.Server({ server: server });
wss.on('connection', (ws) => {
  connections.push(ws);
  console.log('websocket连接已建立！');
  ws.on('message', async (message) => {
    const data = JSON.parse(message);
    console.log('🚀 服务端收到消息:', data);
    if (data.cmd === 'testRun') {
      const json = {
        cmd: 'run',
        key: '0_2',
        param: {},
      };
      broadcastMessage(JSON.stringify(json));
    }
    if (data.cmd === 'testAdd') {
      const json = {
        cmd: 'add',
        key: '0_2',
        param: {},
      };
      broadcastMessage(JSON.stringify(json));
    }
  });
  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});
// 广播消息给所有连接
function broadcastMessage(message) {
  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}
module.exports = app;
