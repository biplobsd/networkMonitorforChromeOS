const scopeNodeId = '92c24f78-3e31-11ef-8e41-a434d9c30cda';
let intervalId;
let isPaused = false;
const notificationId = 'speedNotification';
const placeholderIconUrl = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";

async function fetchDataAndCalculateAverage() {
  const currentTime = Math.floor(Date.now() / 1000);
  const halfSecondAgo = currentTime - 1;

  const queryParams = new URLSearchParams({
    points: 287,
    format: 'json2',
    after: halfSecondAgo,
    before: currentTime,
    options: 'jsonwrap|nonzero|flip|ms|jw-anomaly-rates|minify',
    contexts: '*',
    scope_contexts: 'system.net|system.cpu|powersupply.power',
    scope_nodes: scopeNodeId,
    nodes: scopeNodeId,
    instances: `system.net@${scopeNodeId}|system.cpu@${scopeNodeId}|powersupply_power.BAT0@${scopeNodeId}|powersupply_power.BAT1@${scopeNodeId}`,
    dimensions: 'received|sent|idle|power',
    labels: '_collect_module:/proc/net/dev|_collect_module:/proc/stat|_collect_module:/sys/class/power_supply',
    'group_by[0]': 'dimension',
    'aggregation[0]': 'sum'
  }).toString();

  try {
    const response = await fetch(`http://localhost:19999/api/v2/data?${queryParams}`);
    const { result: { data: dataPoints } } = await response.json();

    if (!dataPoints.length) {
      console.warn('No data points received');
      return;
    }

    const totals = dataPoints.reduce(
      ([idle, received, sent, power], point) => [
        idle + point[1][0],
        received + point[2][0],
        sent + point[3][0],
        power + point[4][0]
      ],
      [0, 0, 0, 0]
    );

    const avg = sum => sum / dataPoints.length;
    const [idle, received, sent, power] = totals.map(avg);

    const totalReceivedSpeed = Math.abs(received / 8);
    const totalSentSpeed = Math.abs(sent / 8);
    const totalSpeedSum = totalReceivedSpeed + totalSentSpeed;

    const formatSpeed = speed => speed >= 1024 ? `${(speed / 1024).toFixed(2)} MB/s` : `${speed.toFixed(2)} KB/s`;

    const cpuUsage = 100 - idle.toFixed(0);
    const color = cpuUsage < 20 ? '#1976D2' : cpuUsage < 50 ? '#FFC107' : '#D32F2F';

    const iconUrl = await createIconDataUrl(`${cpuUsage}%`, color);
    const title = formatSpeed(totalSpeedSum);
    const message = `${power.toFixed(2)}W | ${formatSpeed(totalReceivedSpeed)} | ${formatSpeed(totalSentSpeed)}`;
    const options = {
      type: 'basic',
      iconUrl,
      title,
      message,
      buttons: [{ title: isPaused ? "Resume" : "Pause" }]
    };

    chrome.notifications.update(notificationId, options, wasUpdated => {
      if (!wasUpdated) {
        chrome.notifications.create(notificationId, options);
      }
    });

  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

async function createIconDataUrl(text, color) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = 128;
  canvas.height = 128;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = color;
  context.font = 'bold 50px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  return canvas.toDataURL();
}

function handleButtonClick(notifId, btnIdx) {
  if (notifId === notificationId && btnIdx === 0) {
    isPaused ? resumeFetching() : pauseFetching();
  }
}

function pauseFetching() {
  clearInterval(intervalId);
  isPaused = true;
  updateNotification();
}

function resumeFetching() {
  intervalId = setInterval(fetchDataAndCalculateAverage, 1000);
  isPaused = false;
  updateNotification();
}

function updateNotification() {
  const options = {
    type: 'basic',
    iconUrl: placeholderIconUrl,
    title: 'Status',
    message: isPaused ? 'Paused' : 'Running',
    buttons: [{ title: isPaused ? "Resume" : "Pause" }]
  };

  chrome.notifications.update(notificationId, options, wasUpdated => {
    if (!wasUpdated) {
      chrome.notifications.create(notificationId, options);
    }
  });
}

chrome.notifications.onButtonClicked.removeListener(handleButtonClick);
chrome.notifications.onButtonClicked.addListener(handleButtonClick);

chrome.runtime.onStartup.addListener(resumeFetching);
chrome.app.runtime.onLaunched.addListener(() => {
  chrome.app.window.create('index.html', {
    id: 'mainWindow',
    bounds: { width: 800, height: 600 }
  });
  resumeFetching();
});
