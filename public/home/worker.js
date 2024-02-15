importScripts("https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js");
import * as ort from "onnxruntime-web";
import { Tensor } from 'onnxruntime-web';
import { env } from 'onnxruntime-web';
env.wasm.wasmPaths = {
  'ort-wasm.wasm': '../ort-wasm.wasm',
  'ort-wasm-simd.wasm': '../ort-wasm-simd.wasm',
  'ort-wasm-threaded.wasm': '../ort-wasm-threaded.wasm',
  // Add other WASM files as needed
};



onmessage = async(event) => {
    const input = event.data;
    const output = await run_model(input);
    postMessage(output);
}
// run model ---------------------
async function run_model(input) {
    const modelurl = "best.onnx"
    const model = await ort.InferenceSession.create(modelurl,{executionProviders: ['wasm'],});
    const inputTensor = new Tensor("float32", input, [1, 3, 640, 640]);
    const outputs = await model.run({images:inputTensor});
    return outputs["output0"].data;
}
  