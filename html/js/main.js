urlSrc = "https://hof9lsfvs9.execute-api.us-east-1.amazonaws.com/default/romario-bot?source=html&"

function getRepos() {
	function setRepos(data){
		var combo = document.getElementById("squad");
		data.sort();
		for (var i = 0; i < data.length; i++) {
			var option = document.createElement("option");
			option.value = data[i];
			option.text = data[i];
			combo.add(option);
		}
	}

	url = urlSrc + "action=get_gh_repos";
	$.getJSON(url, setRepos);
}

function getLabels() {
	function setLabels(data){
		var container = document.getElementById("tagsContainer");
		container.innerHTML = "";

		var iDiv = document.createElement('div');
		iDiv.className = 'tags-item';

		var checkbox = document.createElement('input');
		checkbox.type = "checkbox";
		checkbox.checked = true;
		checkbox.onclick = function () {
			$('.tags').prop('checked', this.checked);
		};

		var label = document.createElement('label')
		label.innerHTML = 'Selecionar / Deselecionar todos';

		iDiv.appendChild(checkbox);
		iDiv.appendChild(label);
		container.appendChild(iDiv);

		for (var i = 0; i < data.length; i++) {
			var iDiv = document.createElement('div');
			iDiv.className = 'tags-item';

			var checkbox = document.createElement('input');
			checkbox.type = "checkbox";
			checkbox.name = "tags";
			checkbox.value = data[i];
			checkbox.id = "tags";
			checkbox.className = "tags";
			checkbox.checked = true;

			var label = document.createElement('label')
			label.innerHTML = data[i];

			iDiv.appendChild(checkbox);
			iDiv.appendChild(label);
			container.appendChild(iDiv);
		}

		showHideTags(true)
	}

	squad = $( "#squad option:selected" ).text();
	url = urlSrc + "action=get_gh_team_labels&repo=" + squad;
	$.getJSON(url, setLabels);
}

function showHideTags(show){
	container = document.getElementById("tagsContainer");
	filter = document.getElementById("tagsFilter");

	if (show == true || (show == null && tagsFilter.innerHTML == "Tags &gt;")) {
		container.style.display = 'block'
		tagsFilter.innerHTML = "Tags \\/"
	} else if (show == false || (show == null && tagsFilter.innerHTML == "Tags \\/")) {
		container.style.display = 'none'
		tagsFilter.innerHTML = "Tags &gt;"
	}
}

function printChart() {
	showHideTags(false)

	var squad;
	var avg;
	var from_date;
	var average = 7
	if ($("#average").val() != "" && !isNaN($("#average").val())){
		average = parseInt($("#average").val());
	}
	 
	function addDataThr(data) {
		var dataPoints = [];
		var dataPointsAvg = [];
		var dataPointsStdDev = [];
		var dataPointsStdDevIdeal = [];

		var dps = data.throughput;
		var keys = Object.keys(dps);
		keys.sort();
		for (var i = 0; i < keys.length; i++) {
			
			dataPointsAvg.push({
				x: new Date(keys[i] + ' 12:00:00'),
				y: dps[keys[i]][0][0]
			});

			dataPoints.push({
				x: new Date(keys[i] + ' 12:00:00'),
				y: dps[keys[i]][1]
			});

			dataPointsStdDev.push({
				x: new Date(keys[i] + ' 12:00:00'),
				//y: [dps[keys[i]][0][0] - (dps[keys[i]][0][1] / Math.sqrt(average)), dps[keys[i]][0][0] + (dps[keys[i]][0][1] / Math.sqrt(average))]
				y: [dps[keys[i]][0][0] - dps[keys[i]][0][1], dps[keys[i]][0][0] + dps[keys[i]][0][1]]
			});

			dataPointsStdDevIdeal.push({
				x: new Date(keys[i] + ' 12:00:00'),
				//y: [dps[keys[i]][0][0] - (dps[keys[i]][0][1] / Math.sqrt(average)), dps[keys[i]][0][0] + (dps[keys[i]][0][1] / Math.sqrt(average))]
				y: [dps[keys[i]][0][0] - (dps[keys[i]][0][0] * 1.5), dps[keys[i]][0][0] + (dps[keys[i]][0][0] * 1.5)]
			});
		}

		var chartThr = new CanvasJS.Chart("chartContainerThr", {
			animationEnabled: true,
			theme: "dark1",
			zoomEnabled: true,
			title: {
				text: "Throughput"
			},
			axisY: {
				title: "Qtd",
				titleFontSize: 24,
				crosshair: {
					enabled: true
				}
			},
			axisX: {
				crosshair: {
					enabled: true,
					snapToDataPoint: true
				}
			},
			data: [{
				type: "rangeSplineArea",
				dataPoints: dataPointsStdDev,
				showInLegend: true, 
				legendText: average + " day standard deviation",
				connectNullData: true,
				markerSize: 0,
				color: "gray"
			}, {
				type: "rangeSplineArea",
				dataPoints: dataPointsStdDevIdeal,
				showInLegend: true, 
				legendText: "Ideal standard deviation",
				connectNullData: true,
				fillOpacity: 0,
				markerSize: 0,
				lineDashType: "dash",
				color: "white"
			}, {
				type: "column",
				dataPoints: dataPoints,
				showInLegend: true, 
				legendText: "Throughput",
				color: "#3F6BAD",
				click: function(e){
					window.open('https://github.com/grupozap/' + $( "#squad option:selected" ).text() + '/issues?q=is:issue closed:' + e.dataPoint.x.toISOString().split('T')[0]);
				}
			}, {
				type: "line",
				dataPoints: dataPointsAvg,
				showInLegend: true, 
				legendText: average + " day average",
				connectNullData: true,
				color: "#C0392B"
			}]
		});

		chartThr.render();
	}

	function addDataLT(data) {
		var dataPointsLT = [];
		var dataPointsLTAvg = [];
		var dataPointsLTStdDev = [];
		var dataPointsLTStdDevIdeal = [];

		var dps = data.leadtime;
		var keys = Object.keys(dps);
		keys.sort();
		for (var i = 0; i < keys.length; i++) {
			dataPointsLTAvg.push({
				x: new Date(keys[i] + ' 12:00:00'),
				y: dps[keys[i]][0][0]
			});

			dataPointsLTStdDev.push({
				x: new Date(keys[i] + ' 12:00:00'),
				//y: [dps[keys[i]][0][0] - (dps[keys[i]][0][1] / Math.sqrt(average)), dps[keys[i]][0][0] + (dps[keys[i]][0][1] / Math.sqrt(average))]
				y: [dps[keys[i]][0][0] - dps[keys[i]][0][1], dps[keys[i]][0][0] + dps[keys[i]][0][1]]
			});

			dataPointsLTStdDevIdeal.push({
				x: new Date(keys[i] + ' 12:00:00'),
				//y: [dps[keys[i]][0][0] - (dps[keys[i]][0][1] / Math.sqrt(average)), dps[keys[i]][0][0] + (dps[keys[i]][0][1] / Math.sqrt(average))]
				y: [dps[keys[i]][0][0] - (dps[keys[i]][0][0] * 1.5), dps[keys[i]][0][0] + (dps[keys[i]][0][0] * 1.5)]
			});

			var leadTimes = []
			for (var z = 1; z < dps[keys[i]].length; z++) {
				dataPointsLT.push({
					x: new Date(keys[i] + ' 12:00:00'),
					y: dps[keys[i]][z][1],
					issue: dps[keys[i]][z][0]
				});
			}
		}

		var chartLT = new CanvasJS.Chart("chartContainerLT", {
			animationEnabled: true,
			theme: "dark1",
			zoomEnabled: true,
			title: {
				text: "LeadTime"
			},
			axisY: {
				title: "Days",
				titleFontSize: 24,
				crosshair: {
					enabled: true
				}
			},
			axisX: {
				crosshair: {
					enabled: true,
					snapToDataPoint: true
				}
			},
			data: [{
				type: "rangeSplineArea",
				dataPoints: dataPointsLTStdDev,
				showInLegend: true, 
				legendText: average + " day standard deviation",
				connectNullData: true,
				markerSize: 0,
				color: "gray"
			}, {
				type: "rangeSplineArea",
				dataPoints: dataPointsLTStdDevIdeal,
				showInLegend: true, 
				legendText: "Ideal standard deviation",
				connectNullData: true,
				fillOpacity: 0,
				markerSize: 0,
				lineDashType: "dash",
				color: "white"
			}, {
				type: "scatter",
				dataPoints: dataPointsLT,
				connectNullData: true,
				markerSize: 15,
				showInLegend: true, 
				legendText: "LeadTime",
				color: "#3F6BAD",
				toolTipContent: "Issue: {issue}<br>Date: {x}<br>Days: {y}",
				click: function(e){
					window.open('https://github.com/grupozap/' + $( "#squad option:selected" ).text() + '/issues/' + e.dataPoint.issue);
				}
			}, {
				type: "line",
				dataPoints: dataPointsLTAvg,
				showInLegend: true, 
				legendText: average + " day average",
				toolTipContent: "Date: {x}<br>Average: {y}",
				connectNullData: true,
				color: "#C0392B"
			}]
		});

		chartLT.render();
	}

	function addDataLoad(data) {
		var dataPointsLoad = [];

		var titles = data.tagsTitles;
		if (titles.length > 0){
			document.getElementById("chartContainerLoad").style.display = "block";
		}else{
			document.getElementById("chartContainerLoad").style.display = "none";
		}
		var dps = data.throughput;
		var keys = Object.keys(dps);
		keys.sort();
	
		for (var i = 0; i < titles.length; i++) {
			dataPointsLoad.push({
				type: "stackedArea100",
				name: titles[i],
				showInLegend: "true",
				markerSize: 0,
				dataPoints: []
			})
		}

		for (var i = 0; i < keys.length; i++) {
			for (var j = 0; j < titles.length; j++) {
				dataPointsLoad[j].dataPoints.push({
					x: new Date(keys[i] + ' 12:00:00'),
					y: dps[keys[i]][2][j]
				});
			}
		}

		var chartLoad = new CanvasJS.Chart("chartContainerLoad", {
			animationEnabled: true,
			theme: "dark1",
			zoomEnabled: true,
			toolTip:{			 
					content: "<b>{name}:<b> #percent %"
					//shared: true
			},
			title: {
				text: "Charge Load"
			},
			axisY: {
				title: "Work %",
				titleFontSize: 24,
				crosshair: {
					enabled: true
				}
			},
			axisX: {
				crosshair: {
					enabled: true,
					snapToDataPoint: true
				}
			},
			data: dataPointsLoad
		});

		chartLoad.render();
	}

	function addDataLtHist(data) {
		var dataPoints = [];

		var dps = data.leadtime;
		finalData = {}
		qtd=0
		for (var key in dps) {
			d = dps[key]
			if (d.length > 1){
				for (var j = 1; j < d.length; j++){
					item = d[j]
					if (item[1] in finalData){
						finalData[item[1]] = finalData[item[1]] + 1
					}else{
						finalData[item[1]] = 1
					}
					qtd++
				}
			}
		}

		qtd2=0
		var keys = Object.keys(finalData);
		keys.sort(function(a, b){
			var x=parseInt(a),
				y=parseInt(b);
			return x<y ? -1 : x>y ? 1 : 0;
		});
		for (var i = 0; i < keys.length; i++) {
			qtd2+=finalData[keys[i]]
			dataPoints.push({
				x: parseInt(keys[i]),
				y: finalData[keys[i]],
				perc: parseInt((qtd2 / qtd) * 100)
			});
		}

		var chartLtHist = new CanvasJS.Chart("chartContainerLtHist", {
			animationEnabled: true,
			theme: "dark1",
			zoomEnabled: true,
			title: {
				text: "Leadtime Histogram"
			},
			axisY: {
				title: "Qty",
				titleFontSize: 24,
				crosshair: {
					enabled: true
				}
			},
			axisX: {
				crosshair: {
					enabled: true,
					snapToDataPoint: true
				}
			},
			toolTip:{
				shared:true,
				content: "{perc}% of items completed in {x} days or less"
			},  
			data: [{
				type: "column",
				color: "#3F6BAD",
				dataPoints: dataPoints
			}]
		});

		chartLtHist.render();
	}

	function addDataCFD(data) {
		var dataPointsOpen = [];
		var dataPointsAssigned = [];
		var dataPointsClosed = [];

		var dateFrom = new Date(data.dateFrom + ' 12:00:00')
		var dateTo = new Date(data.dateTo + ' 12:00:00')
		var cfd = {}
		var dps = data.cfd;

		for (var i = 0; i < dps.length; i++) {
			issue = dps[i]

			key = new Date(issue['created_at'] + ' 12:00:00')

			if (key >= dateFrom){
				a=true
			}

			key = (key < dateFrom ? dateFrom : key)

			if (key in cfd){
				cfd[key] = [cfd[key][0] + 1, cfd[key][1], cfd[key][2]]
			} else {
				cfd[key] = [1, 0, 0]
			}

			if ('assigned_at' in issue){
				key = new Date(issue['assigned_at'] + ' 12:00:00')
				key = (key < dateFrom ? dateFrom : key)
				if (key in cfd){
					cfd[key] = [cfd[key][0] - 1, cfd[key][1] + 1, cfd[key][2]]
				} else {
					cfd[key] = [-1, 1, 0]
				}

				if ('closed_at' in issue){
					key = new Date(issue['closed_at'] + ' 12:00:00')
					key = (key < dateFrom ? dateFrom : key)
					if (key in cfd){
						cfd[key] = [cfd[key][0], cfd[key][1] - 1, cfd[key][2] + 1]
					} else {
						cfd[key] = [0, -1, 1]
					}
				}

			} else {
				if ('closed_at' in issue){
					key = new Date(issue['closed_at'] + ' 12:00:00')
					key = (key < dateFrom ? dateFrom : key)
					if (key in cfd){
						cfd[key] = [cfd[key][0] - 1, cfd[key][1], cfd[key][2] + 1]
					} else {
						cfd[key] = [-1, 0, 1]
					}
				}
			}

			a = true
		}

		results = [0, 0, 0]

		while (dateFrom <= dateTo) {
			var key = new Date(dateFrom)

			result = cfd[key]
			if (result != null){
				results[0] += result[0]
				results[1] += result[1]
				results[2] += result[2]
			}

			dataPointsClosed.push({
				x: key,
				y: results[2],
				name: 'closed'
			});

			dataPointsAssigned.push({
				x: key,
				y: results[1],
				name: 'assigned'
			});

			dataPointsOpen.push({
				x: key,
				y: results[0],
				name: 'open'
			});

			dateFrom.setDate(new Date(dateFrom.toISOString().split('T')[0] + ' 12:00:00').getDate() + 1);
		}

		var chart = new CanvasJS.Chart("chartContainerCFD", {
			animationEnabled: true,
			theme: "dark1",
			zoomEnabled: true,
			title: {
				text: "Cumulative Flow Diagram"
			},
			toolTip: {
				shared: true
			},
			axisY: {
				title: "Qty",
				titleFontSize: 24,
				minimum: 0,
				crosshair: {
					enabled: true
				}
			},
			axisX: {
				crosshair: {
					enabled: true,
					snapToDataPoint: true
				}
			},

			data: [{
				type: "stackedArea",
				dataPoints: dataPointsClosed,
				showInLegend: true, 
				markerSize: 0,
				legendText: "Closed",
			}, {
				type: "stackedArea",
				dataPoints: dataPointsAssigned,
				showInLegend: true, 
				markerSize: 0,
				legendText: "Assigned",
			}, {
				type: "stackedArea",
				dataPoints: dataPointsOpen,
				showInLegend: true, 
				markerSize: 0,
				legendText: "Open",
			}]
		});

		chart.render();
	}

	function addData(data){
		addDataThr(data);
		addDataLT(data);
		addDataLoad(data);
		addDataLtHist(data);
	}

	function openThroughput(date){

	}

	function loadJSON(json_path, callback) {   
		var xobj = new XMLHttpRequest();
		xobj.overrideMimeType("application/json");
		xobj.open('GET', json_path, true); // Replace 'my_data' with the path to your file
		xobj.onreadystatechange = function () {
			if (xobj.readyState == 4 && xobj.status == "200") {
				// Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
				callback(xobj.responseText);
			}
		};
		xobj.send(null);  
	}


	squad = $( "#squad option:selected" ).text();
	from_date = ""
	tags = ""
	avg = ""

	if ($("#fromDate").val() != ""){
		from_date = "&from_date=" + $("#fromDate").val();	
	}
	if ($("#average").val() != "" && !isNaN($("#average").val())){
		avg = "&average=" + $("#average").val();
	}

	var val = [];
	$(".tags:checked").each(function(i){
	   val[i] = $(this).val();
	});
	if (val.length > 0){
		tags = '&labels=' + val.toString()
	}


	url = urlSrc + "action=get_leadtime&repo=" 
		+ squad + from_date + tags + avg;

	$.getJSON(url, addData);

	url = urlSrc + "action=get_gh_cfd&repo=" 
	+ squad + from_date + tags + avg;

	$.getJSON(url, addDataCFD);
}