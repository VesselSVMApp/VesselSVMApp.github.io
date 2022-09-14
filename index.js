const Stream = require("node-rtsp-stream");
let List_streamUrl = [];

List_streamUrl.push("rtsp://210.99.70.120:1935/live/cctv001.stream");
List_streamUrl.push("rtsp://210.99.70.120:1935/live/cctv028.stream");
List_streamUrl.push("rtsp://210.99.70.120:1935/live/cctv016.stream");
List_streamUrl.push("rtsp://210.99.70.120:1935/live/cctv017.stream");

stream = new Stream({
  name: "foscam_stream",
  streamUrl: List_streamUrl[0],
  wsPort: 30001,
  // width: 480,
  // height: 320,
});

stream_2 = new Stream({
  name: "foscam_stream_2",
  streamUrl: List_streamUrl[1],
  wsPort: 30002,
});

stream_3 = new Stream({
  name: "foscam_stream_3",
  streamUrl: List_streamUrl[2],
  wsPort: 30003,
});

stream_4 = new Stream({
  name: "foscam_stream_4",
  streamUrl: List_streamUrl[3],
  wsPort: 30004,
});
