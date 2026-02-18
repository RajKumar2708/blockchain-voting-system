const video = document.getElementById("video");
const statusText = document.getElementById("status");

console.log("face.js loaded");

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/frontend/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/frontend/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/frontend/models")
]).then(startVideo).catch(err => {
  console.error("Model loading error:", err);
  statusText.innerText = "Model loading failed";
});


async function startVideo() {
  try {
    console.log("Requesting camera...");
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    statusText.innerText = "Camera started";
    console.log("Camera started");
  } catch (err) {
    console.error("Camera error:", err);
    statusText.innerText = "Camera access blocked";
  }
}

async function getDescriptor() {
  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detection ? Array.from(detection.descriptor) : null;
}

async function registerFace() {
  const email = document.getElementById("email").value;
  const descriptor = await getDescriptor();

  if (!descriptor) {
    statusText.innerText = "Face not detected";
    return;
  }

  await fetch("http://localhost:5000/api/auth/register-face", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, descriptor })
  });

  statusText.innerText = "Face registered successfully";
}

async function verifyFace() {
  const email = document.getElementById("email").value;
  const descriptor = await getDescriptor();

  const res = await fetch("http://localhost:5000/api/auth/verify-face", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, descriptor })
  });

  const data = await res.json();
  statusText.innerText = data.message;
}
