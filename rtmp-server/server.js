const NodeMediaServer = require('node-media-server');
const express = require('express');
const path = require('path');

// --- Media Server for RTMP/FLV ---
const nmsConfig = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: 8000, // Internal port for FLV stream, not exposed to user
    allow_origin: '*',
  },
};

const nms = new NodeMediaServer(nmsConfig);
nms.run();

// --- Web Server for the Player Page ---
const app = express();
const web_port = 8002;

app.use(express.static(path.join(__dirname, 'www')));

app.listen(web_port, () => {
  console.log(`Node Media Server is running...`);
  console.log(`RTMP Ingest: rtmp://localhost:1935/live/{STREAM_KEY}`);
  console.log(`Player Page: http://localhost:${web_port}/flv-player.html`);
  console.log(`FLV Stream is handled internally by the media server.`);
});