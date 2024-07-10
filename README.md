# Network Monitor
ChromeOS Internet speed meter. With help of netdata this chrome app push notification to view internet speed, battery watts, cpu usages

![image](https://github.com/biplobsd/networkMonitorforChromeOS/assets/43641536/3ccc45ba-c1d9-4959-9c55-68a8668b13c6)


## Installation
1. Enable chrome os developer crosh shell; `Press [ Ctrl ] [ Alt ] [ T ] `
2. Install netdata by run this command in crosh shell `curl https://get.netdata.cloud/kickstart.sh > /tmp/netdata-kickstart.sh && sh /tmp/netdata-kickstart.sh --no-updates --stable-channel --disable-telemetry`
3. Get `scopeNodeId` from the `http://localhost:19999/api/v2/info` key is `mg`. `mg` value is the `scopeNodeId`
4. Now replace your scopeNodeId on the background script
5. Now load unpacked this folder on `chrome://extensions/`
6. If there is no notification start then open the Network Monitor from the application list.

## Configure auto start netdata
Copy netdata.conf to the init directory. `sudo cp netdata.conf /etc/init/`
