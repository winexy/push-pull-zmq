const cluster = require('cluster');
const zmq = require('zeromq');
const { log, decode, encode } = require('./utils');

if (cluster.isMaster) {
  let readyClustersCounter = 0;
  const numOfCores = require('os').cpus().length;

  const push = zmq.socket('push').bind('ipc://push-test.ipc');
  const pull = zmq.socket('pull').bind('ipc://pull-test.ipc');

  for (let i = 0; i < numOfCores; i++) {
    cluster.fork();
  }


  pull.on('message', data => {
    const { type, msg } = decode(data);

    switch (type) {
      case 'ready':
        log(`Process ${msg} is ready`);
        readyClustersCounter++;
        if (readyClustersCounter === numOfCores) {
          for (let i = 0; i < 30; i++) {
            push.send(encode({
              type: 'job',
              msg: i
            }));
          }
        }
        break;
      case 'result':
        log(msg);
    }
  });

} else {
  const pull = zmq.socket('pull').connect('ipc://push-test.ipc');
  const push = zmq.socket('push').connect('ipc://pull-test.ipc');

  push.send(encode({
    type: 'ready',
    msg: process.pid
  }));

  pull.on('message', data => {
    const { type, msg } = decode(data);

    if (type === 'job') {
      push.send(encode({
        type: 'result',
        msg: `Process ${process.pid} finished job #${msg}`
      }));
    }

  });


}

