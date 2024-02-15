import * as ort from "onnxruntime-web";
import { Tensor } from 'onnxruntime-web';
import { env } from 'onnxruntime-web';
env.wasm.wasmPaths = {
  'ort-wasm.wasm': '../ort-wasm.wasm',
  'ort-wasm-simd.wasm': '../ort-wasm-simd.wasm',
  'ort-wasm-threaded.wasm': '../ort-wasm-threaded.wasm',
  // Add other WASM files as needed
};

let form = document.getElementById("upload-video");
form.addEventListener("submit", function (e) {
  e.preventDefault();
  let formData = new FormData(form);
  const fileInput = document.getElementById("formFile");
  const file = fileInput.files[0]; // Lấy file đầu tiên trong trường input

  if (file) {
    console.log("File selected:", file.name);
    formData.append("file", file);
    fetch("http://localhost:3000/api/v1/upload_video", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data.filePath);

        document.getElementById(
          "video-upload-display"
        ).src = `http://localhost:3000${data.filePath}`;
      });
  } else {
    console.log("No file selected");
  }
});


const video = document.querySelector("video");

let interval
let boxes = [];
video.addEventListener("play", async() => {
  const canvas = document.querySelector("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext("2d");
  interval = setInterval(async() => {
    context.drawImage(video, 0, 0);
    draw_boxes(canvas,boxes)
    
    const input = prepare_input(canvas);
    // console.log(input);
    const output = await run_model(input);
    // console.log(output);
    boxes = process_output(output,canvas.width,canvas.height);
    // console.log(boxes);
  }, 30);
  video.addEventListener("pause", () => {
    clearInterval(interval);
  });
});

const btnPlay = document.getElementById("btn-play");
const btnStop = document.getElementById("btn-stop");
btnPlay.addEventListener("click", () => {
  video.play();
});
btnStop.addEventListener("click", () => {
  video.pause();
});

// prepare input ---------------------
function prepare_input(img) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 640;
  const context = canvas.getContext("2d");
  // Chuyển ảnh về kích thước 640x640
  context.drawImage(img, 0, 0, 640, 640);

  const data = context.getImageData(0,0,640,640).data;
  const red = [],
    green = [],
    blue = [];
  // Lấy dữ liệu từ canvas
  // Mỗi pixel có 4 giá trị: red, green, blue, alpha
  // Dữ liệu được lưu dưới dạng mảng 1 chiều
  // Mỗi 4 phần tử liên tiếp tạo thành 1 pixel
  // Ví dụ: data = [r1,g1,b1,a1,r2,g2,b2,a2,...]
  // Trong đó r1,g1,b1 là red, green, blue của pixel thứ nhất
  // r2,g2,b2 là red, green, blue của pixel thứ 2
  for (let i = 0; i < data.length; i += 4) {
    red.push(data[i] / 255.0);
    green.push(data[i + 1] / 255.0);
    blue.push(data[i + 2] / 255.0);
  }
  // Trả về mảng 1 chiều gồm các giá trị red, green, blue của từng pixel
  // Mỗi giá trị nằm trong khoảng [0,1]
  return [...red, ...green, ...blue];
}

// run model ---------------------
async function run_model(input) {
  const modelurl = "best.onnx"
  const model = await ort.InferenceSession.create(modelurl,{executionProviders: ['wasm'],});
  const inputTensor = new Tensor("float32", input, [1, 3, 640, 640]);
  const outputs = await model.run({images:inputTensor});
  return outputs["output0"].data;
}

// process output ---------------------
function iou(box1,box2) {
  return intersection(box1,box2)/union(box1,box2);
}

function union(box1,box2) {
  const [box1_x1,box1_y1,box1_x2,box1_y2] = box1;
  const [box2_x1,box2_y1,box2_x2,box2_y2] = box2;
  const box1_area = (box1_x2-box1_x1)*(box1_y2-box1_y1)
  const box2_area = (box2_x2-box2_x1)*(box2_y2-box2_y1)
  return box1_area + box2_area - intersection(box1,box2)
}

function intersection(box1,box2) {
  const [box1_x1,box1_y1,box1_x2,box1_y2] = box1;
  const [box2_x1,box2_y1,box2_x2,box2_y2] = box2;
  const x1 = Math.max(box1_x1,box2_x1);
  const y1 = Math.max(box1_y1,box2_y1);
  const x2 = Math.min(box1_x2,box2_x2);
  const y2 = Math.min(box1_y2,box2_y2);
  return (x2-x1)*(y2-y1)
}


const yolo_classes = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
  'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse',
  'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase',
  'frisbee', 'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard',
  'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
  'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch', 'potted plant',
  'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone', 'microwave', 'oven',
  'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
];


function process_output(output, img_width, img_height) {
  let boxes = [];
  for (let index=0;index<8400;index++) {
      const [class_id,prob] = [...Array(80).keys()]
          .map(col => [col, output[8400*(col+4)+index]])
          .reduce((accum, item) => item[1]>accum[1] ? item : accum,[0,0]);
      if (prob < 0.5) {
          continue;
      }
      const label = yolo_classes[class_id];
      const xc = output[index];
      const yc = output[8400+index];
      const w = output[2*8400+index];
      const h = output[3*8400+index];
      const x1 = (xc-w/2)/640*img_width;
      const y1 = (yc-h/2)/640*img_height;
      const x2 = (xc+w/2)/640*img_width;
      const y2 = (yc+h/2)/640*img_height;
      boxes.push([x1,y1,x2,y2,label,prob]);
  }

  boxes = boxes.sort((box1,box2) => box2[5]-box1[5])
  const result = [];
  while (boxes.length>0) {
      result.push(boxes[0]);
      boxes = boxes.filter(box => iou(boxes[0],box)<0.7);
  }
  return result;
}


function draw_boxes(canvas,boxes) {
  const ctx = canvas.getContext("2d");
  ctx.strokeStyle = "#00FF00";
  ctx.lineWidth = 3;
  ctx.font = "18px serif";
  boxes.forEach(([x1,y1,x2,y2,label]) => {
      ctx.strokeRect(x1,y1,x2-x1,y2-y1);
      ctx.fillStyle = "#00ff00";
      const width = ctx.measureText(label).width;
      ctx.fillRect(x1,y1,width+10,25);
      ctx.fillStyle = "#000000";
      ctx.fillText(label, x1, y1+18);
  });
}