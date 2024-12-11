// 변수 선언
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusElem = document.getElementById('status');
const dbElem = document.getElementById('dbValue');

let audioContext;
let analyser;
let microphone;
let bufferLength;
let dataArray;

// 진동 감지 변수
let lastAcceleration = { x: 0, y: 0, z: 0 }; // 이전 가속도
let vibrationThreshold = 15; // 진동 감지 임계값
let isVibrating = false;

// 마이크와 사운드 분석 시작
function startSoundAnalysis() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // 사용자가 마이크 권한을 허용한 경우
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                // 오디오 컨텍스트 생성
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioContext.createAnalyser();

                // 마이크로부터 입력을 받아 오디오 소스를 연결
                microphone = audioContext.createMediaStreamSource(stream);
                microphone.connect(analyser);

                // AnalyserNode 설정
                analyser.fftSize = 256; // 샘플 크기
                bufferLength = analyser.frequencyBinCount;
                dataArray = new Uint8Array(bufferLength);

                // 그래프 업데이트 함수 호출
                draw();
                statusElem.textContent = "상태: 사운드 분석 중...";
            })
            .catch(err => {
                statusElem.textContent = "마이크 권한을 허용하지 않았습니다.";
                console.error("Error accessing microphone: ", err);
            });
    } else {
        statusElem.textContent = "이 브라우저는 getUserMedia를 지원하지 않습니다.";
    }

    // 진동 감지 시작
    if (window.DeviceMotionEvent) {
        window.addEventListener("devicemotion", handleDeviceMotion);
    } else {
        statusElem.textContent = "이 장치는 진동 감지를 지원하지 않습니다.";
    }
}

// 주파수 데이터 분석 후 그래프 그리기
function draw() {
    analyser.getByteFrequencyData(dataArray); // 주파수 데이터 가져오기

    // 캔버스를 지우고 새로 그리기
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 그래프 그리기
    const barWidth = canvas.width / bufferLength; // 각 막대의 너비
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];

        // 색상 설정
        ctx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';

        // 막대 그리기
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1; // 다음 막대로 이동
    }

    // 애니메이션을 위해 계속 호출
    requestAnimationFrame(draw);
}

// 진동 감지 함수
function handleDeviceMotion(event) {
    const acceleration = event.accelerationIncludingGravity;
    
    // 가속도의 변화량을 측정
    const deltaX = Math.abs(acceleration.x - lastAcceleration.x);
    const deltaY = Math.abs(acceleration.y - lastAcceleration.y);
    const deltaZ = Math.abs(acceleration.z - lastAcceleration.z);

    // 진동 감지: 임계값을 초과하면 진동으로 감지
    if (deltaX > vibrationThreshold || deltaY > vibrationThreshold || deltaZ > vibrationThreshold) {
        if (!isVibrating) {
            isVibrating = true;
            statusElem.textContent = "상태: 진동 감지됨!";
            console.log("진동 감지됨!");
        }
    } else {
        isVibrating = false;
    }

    // 이전 가속도 업데이트
    lastAcceleration = acceleration;
}

// 페이지 로드 후 사운드 분석 시작
startSoundAnalysis();
