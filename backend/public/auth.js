let mode = "register";
const video = document.getElementById("video");

// ======================
// INIT FACE + CAMERA
// ======================
async function initFace() {
  const status = document.getElementById("status");
  status.innerText = "Loading face models...";

  await faceapi.nets.tinyFaceDetector.loadFromUri("./models");
  await faceapi.nets.faceLandmark68Net.loadFromUri("./models");
  await faceapi.nets.faceRecognitionNet.loadFromUri("./models");

  status.innerText = "Models loaded. Starting camera...";

  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;

  status.innerText = "Camera started";
}

window.onload = initFace;

// ======================
// MODE SWITCH
// ======================
function toggleMode() {
  const otpSection = document.getElementById("otpSection");

  if (mode === "register") {
    mode = "login";
    document.getElementById("modeTitle").innerText = "Login";
    otpSection.style.display = "none";
  } else {
    mode = "register";
    document.getElementById("modeTitle").innerText = "Register";
    otpSection.style.display = "block";
  }
}

// ======================
// SEND OTP
// ======================
async function sendOTP() {
  const email = document.getElementById("email").value;
  const status = document.getElementById("status");

  if (!email) {
    status.innerText = "Enter email first";
    return;
  }

  const res = await fetch("http://localhost:5000/api/auth/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });

  const data = await res.json();
  status.innerText = data.message || "OTP sent";
}

// ======================
// VERIFY OTP
// ======================
async function verifyOTP() {
  const email = document.getElementById("email").value;
  const otp = document.getElementById("otp").value;
  const status = document.getElementById("status");

  if (!otp) {
    status.innerText = "Enter OTP";
    return;
  }

  const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp })
  });

  const data = await res.json();
  status.innerText = data.message || "OTP verified";
}

// ======================
// CAPTURE FACE
// ======================
async function captureFace() {
  const email = document.getElementById("email").value;
  const status = document.getElementById("status");

  if (!email) {
    status.innerText = "Enter email first";
    return;
  }

  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    status.innerText = "No face detected";
    return;
  }

  const descriptor = Array.from(detection.descriptor);

  const endpoint =
    mode === "register"
      ? "http://localhost:5000/api/face/register"
      : "http://localhost:5000/api/face/verify";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, descriptor })
  });

  const data = await res.json();

  if (mode === "login" && data.verified) {
    status.innerText = "Login successful";
  } else {
    status.innerText = JSON.stringify(data);
  }
}
