const Koa = require('koa');
const app = new Koa();
var WebSocket = require('ws');
const json = require('koa-json');
const onerror = require('koa-onerror');
const bodyparser = require('koa-bodyparser');
const logger = require('koa-logger');
var http = require('http');
const getImagePaths = require('./lib');
const { log } = require('console');
// error handler
onerror(app);
// 变量
const port = 3909;
const serverPort = 3906;
const nodeUUID = 'com.ulanzi.ulanzideck.momentsslideshow';
let currentKey = null;
let currentImageIndex = 0;
let currentParam = {};
let wsToServerClient = null;
let actionKeys = new Map();
const defaultAction = {
  currentIndex: 0,
  isPlay: false,
  imagePaths: [],
  param: {
    my_sharpness: '',
    my_imagepath: '',
    my_size: '144',
    my_delay: '5',
    my_playback: false,
  },
};
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
// 创建 主程序与上位服务连接
server.listen(3909, () => {
  console.log(`plugin服务已启动，监听端口：${port}`);

  // 尝试连接到WebSocket服务端
  const wsUrl = `ws://127.0.0.1:${serverPort}`;
  let retryCount = 0; // 重试计数
  const maxRetry = 5; // 最大重试次数
  const retryInterval = 3000; // 重试间隔，单位毫秒
  function connectToServer() {
    const wssToServer = new WebSocket(wsUrl);
    wsToServerClient = wssToServer;

    wssToServer.on('open', function open() {
      console.log('服务端WebSocket连接已建立');
      retryCount = 0; // 连接成功后重置重试计数
      // 连接打开后，可以发送消息
      const json = {
        code: 0,
        cmd: 'connected',
        uuid: nodeUUID,
      };
      wssToServer.send(JSON.stringify(json));
    });
    wssToServer.on('message', function incoming(message) {
      try {
        const data = JSON.parse(message);
        console.log('🚀 接收到消息：', data);
        if (data.cmd === 'connected') {
          console.log('接收到链接：', message);
          const json = {
            code: 0,
            cmd: 'connected',
          };
          wssToServer.send(JSON.stringify(json));
        }
        // 插件被拖拽时，初始化key和uuid,当上位机有param时，需要初始化此值
        if (data.cmd === 'add') {
          if (!actionKeys.has(data.key)) {
            actionKeys.set(data.key, defaultAction);
          } else {
            // 初始化时，播放状态默认暂停
            if (data.param) {
              actionKeys.set(data.key, {
                currentIndex: 0,
                isPlay: false,
                imagePaths: getImagePaths(data.param.my_imagepath),
                param: {
                  my_sharpness: data.param.my_sharpness,
                  my_imagepath: data.param.my_imagepath,
                  my_size: data.param.my_size,
                  my_delay: data.param.my_delay,
                  my_playback: false,
                },
              });
            }
          }
          const json = {
            code: 0,
            cmd: 'add',
            uuid: nodeUUID,
            key: data.key,
          };
          wssToServer.send(JSON.stringify(json));
        }
        // 处理run信号
        if (data.cmd === 'run') {
          const json = {
            code: 0,
            cmd: 'run',
            uuid: nodeUUID,
            key: data.key,
            param: {},
          };

          wssToServer.send(JSON.stringify(json));
          if (actionKeys.has(data.key)) {
            const nowVal = actionKeys.get(data.key);
            nowVal.isPlay = !nowVal.isPlay;
            if (nowVal.param) {
              nowVal.param.my_playback = !nowVal.param.my_playback;
            }
            actionKeys.set(data.key, nowVal); // 更新Map以确保状态是最新的
            playImage(data.key, nowVal.currentIndex); // 传入key而不是currentIndex和nowVal
          } else {
            actionKeys.set(data.key, defaultAction);
            const nowVal = actionKeys.get(data.key);
            playImage(data.key, nowVal.currentIndex);
          }
        }
      } catch (e) {
        console.error('🚀 ~ incoming ~ e:', e);
      }
    });
    wssToServer.on('error', function error(err) {
      console.error('连接WebSocket服务端出错：', err);
    });
    wssToServer.on('close', function close() {
      console.log('WebSocket连接已关闭');
      // 连接关闭后尝试重连
      if (retryCount < maxRetry) {
        setTimeout(() => {
          console.log(`尝试第${retryCount + 1}次重连...`);
          connectToServer(); // 递归调用重新连接
          retryCount++;
        }, retryInterval);
      } else {
        console.log('达到最大重试次数，停止重连');
      }
    });
  }
  connectToServer(); // 首次尝试连接
});
// 创建 WebSocket 服务器被插件链接
const wss = new WebSocket.Server({ server: server });
wss.on('connection', (ws) => {
  // 将新连接添加到数组中
  console.log('WebSocket 连接到插件已建立！');
  wsToPluginClient = ws;
  ws.on('message', async (message) => {
    const data = JSON.parse(message);
    console.log('🚀 插件发来消息：', data);

    if (data.cmd === 'startRun') {
      if (actionKeys.has(data.key)) {
        const nowVal = actionKeys.get(data.key);
        nowVal.isPlay = true; // 确保播放状态为true
        actionKeys.set(data.key, nowVal); // 更新Map以确保状态是最新的
        playImage(data.key, nowVal.currentIndex); // 传入key而不是currentIndex和nowVal
      }
    }
    if (data.cmd === 'stopRun') {
      stopPlaying(data.key);
    }
    if (data.cmd === 'paramfromplugin') {
      const payload = data.param;
      let imagePaths = [];
      let currentIndex = 0;
      let isPlay = payload.my_playback;
      if (actionKeys.has(data.key)) {
        const oldVal = actionKeys.get(data.key);
        if (isPayloadChanged(payload, oldVal.param)) {
          if (!oldVal.param.my_imagepath || !payload.my_imagepath) {
            return;
          }
          if (payload.my_imagepath !== oldVal.param.my_imagepath) {
            imagePaths = getImagePaths(payload.my_imagepath);
            currentIndex = 0;
          } else {
            imagePaths = oldVal.imagePaths;
            currentIndex = oldVal.currentIndex || 0;
          }
        } else {
          ws.send(
            JSON.stringify({
              code: 0,
            })
          );
          return;
        }
      } else {
        imagePaths = getImagePaths(payload.my_imagepath);
      }
      const newVal = {
        key: data.key,
        imagePaths,
        currentIndex,
        isPlay,
        param: payload,
      };
      console.log('🚀 ~ 属性更新 ~ newVal:', newVal);
      actionKeys.set(data.key, newVal);
      ws.send(
        JSON.stringify({
          code: 0,
        })
      );
    }
  });
  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});
function stopPlaying(key) {
  if (actionKeys.has(key)) {
    let nowVal = actionKeys.get(key);
    nowVal.isPlay = false; // 修改isPlay值来停止递归
    actionKeys.set(key, actionKeys.get(key)); // 更新Map中的对象（这一步在某些情况下是可选的，因为对象是引用类型）
  }
}
function playImage(key, index) {
  const nowVal = actionKeys.get(key);
  nowVal.key = key;
  if (!nowVal || !nowVal.isPlay || !nowVal.imagePaths) {
    return; // 如果nowVal不存在或isPlay为false，则退出函数
  }
  console.log(`插件《《${key}》》开始运行`, index);
  nowVal.currentIndex = index;
  // const imagePaths = ['a', 'b', 'c'];
  const imagePaths = nowVal.imagePaths || [];
  if (imagePaths.length === 0) {
    return;
  }
  nowVal.currentIndex = nowVal.currentIndex % imagePaths.length;
  setNewImage(nowVal); // 假设这个函数正确处理nowVal
  if (nowVal.currentIndex < imagePaths.length) {
    // 再次检查是否应该继续播放
    setTimeout(() => {
      playImage(key, nowVal.currentIndex + 1); // 递归调用，传入key以获取最新的nowVal
    }, parseInt(nowVal.param.my_delay) * 1000);
  }
}
function setNewImage(nowVal) {
  payload = {
    statelist: [
      {
        uuid: nodeUUID,
        type: 2,
        key: nowVal.key,
        path: nowVal.imagePaths[nowVal.currentIndex],
      },
    ],
  };
  if (wsToServerClient) {
    console.log('🚀 ~ 向服务端发送:', payload);
    const json = {
      cmd: 'state',
      uuid: nodeUUID,
      key: nowVal.key,
      param: payload,
    };
    wsToServerClient.send(JSON.stringify(json));
  }
}
function isPayloadChanged(newPayload, lastPayload) {
  // 比较两个对象的键值对是否完全相同
  const keys = Object.keys(newPayload);
  // 检查键的数量是否相同
  if (keys.length !== Object.keys(lastPayload).length) {
    return true;
  }
  // 检查每个键的值是否相同
  for (let key of keys) {
    if (newPayload[key] !== lastPayload[key]) {
      return true;
    }
  }
  // 如果所有键的值都相同，则返回false
  return false;
}
module.exports = app;
