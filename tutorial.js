let selectedTelemetryPoint = "both";
let selectedSorting = "ascending";
let liveTableData = [];
let ws = new WebSocket('ws://localhost:8080/realtime');

ws.onopen = function(){
  	loadTelemetry();   
}

ws.onmessage = function(msg) {
    let liveData = JSON.parse(msg.data);
    liveData.date = new Date(liveData.timestamp);
    liveTableData.push(liveData);
    let templiveTableData = [...liveTableData];
    if (selectedSorting === "descending") {
  		templiveTableData.sort((a, b) => b.date - a.date); 
  	}
    const liveTable = document.getElementById("liveTable");
    liveTable.innerHTML = "";
    let liveStr = "<tr><th>ID</th><th>Timestamp</th><th>Value</th></tr>";
  	templiveTableData.forEach(item => {
  		liveStr += "<tr><td>" + item.id + "</td><td>" + item.date + "</td><td>" + item.value + "</td></tr>";
  	});
	liveTable.innerHTML = liveStr;
} 

function selectTelemetryPoint(telelemetryType) {
	selectedTelemetryPoint = telelemetryType;
	const items = document.getElementsByClassName("telemetryPoint");
	for (let i = 0; i < items.length; i++) {
		if (items[i].id === selectedTelemetryPoint) {
			items[i].className = "telemetryPoint active";
		} else {
			items[i].className = "telemetryPoint inactive";
		}	
	}
	loadTelemetry();
}

function selectSorting(sort) {
	selectedSorting = sort;
	const items = document.getElementsByClassName("order");
	for (let i = 0; i < items.length; i++) {
		if (items[i].id === selectedSorting) {
			items[i].className = "order active";
		} else {
			items[i].className = "order inactive";
		}	
	}
	loadTelemetry();
}


function loadTelemetry() {

	//Historical Data
	
	let queries = [];
	let now = new Date();
	let endTime = Number(now);
	let startTime = Number(new Date(now.getTime() - (15 * 60000)));
	
	if (selectedTelemetryPoint === "pwrc" || selectedTelemetryPoint === "both") {
		queries.push("http://localhost:8080/history/pwr.c?start=" + startTime + "&end=" + endTime);
	}
	if (selectedTelemetryPoint === "pwrv" || selectedTelemetryPoint === "both") {
		queries.push("http://localhost:8080/history/pwr.v?start=" + startTime + "&end=" + endTime);
	}
	let fetchResult = [], processedResult = [];
	let requests = queries.map(query => fetch(query).then(response => response.json()).then(json => fetchResult.push(json)));
  	Promise.all(requests).then(() => {
  		for (let i = 0; i < fetchResult[0].length; i++) {
  			for (let j = 0; j < fetchResult.length; j++) {
  				fetchResult[j][i].date = new Date(fetchResult[j][i].timestamp);
  				processedResult.push(fetchResult[j][i]);
  			}
  		}
  		if (selectedSorting === "descending") {
  			processedResult.sort((a, b) => b.date - a.date); 
  		}
  		let historicalStr = "<tr><th>ID</th><th>Timestamp</th><th>Value</th></tr>";
  		processedResult.forEach(item => {
  			historicalStr += "<tr><td>" + item.id + "</td><td>" + item.date + "</td><td>" + item.value + "</td></tr>";
  		});
		const historicalTable = document.getElementById("historicalTable");
		historicalTable.innerHTML = historicalStr;
  	});
  	
  	// Live Data
  	
  	liveTableData = [];
  	if (selectedTelemetryPoint === "pwrc") {
  		ws.send("unsubscribe pwr.v");
  		ws.send("subscribe pwr.c");
  	} else if (selectedTelemetryPoint === "pwrv") {
  		ws.send("unsubscribe pwr.c");
  		ws.send("subscribe pwr.v");
  	} else if (selectedTelemetryPoint === "both") {
  		ws.send("subscribe pwr.c");
  		ws.send("subscribe pwr.v");
  	}
  	
}