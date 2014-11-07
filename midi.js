/* Browserify gives us the power of npm ! */
var midiConverter = require('midi-converter');
// var eyes = require('eyes'),
	_ = require('lodash')

var log = console.log.bind(console);


// The midi analysis section

var nBeat = 0,
		keyInts = [],
		keyLats = [],
		timeoutObj,
		timerObj,
		debut;

var midi2json = function midi2json(blob) {
	nBeat = 0;
	keyInts = [];
	keyLats = [];

	var jsonSong = midiConverter.midiToJson(blob);

	song = jsonSong;
	var header = jsonSong.header;

	tempo = _.filter(jsonSong.tracks[0],{subtype: "setTempo"})[0].microsecondsPerBeat/1000;
	// tempo = 1000;
	var beatsPerMinute = 60000/tempo;
	// en ms per beat

	var scale = 1000*tempo/header.ticksPerBeat;

	var tracks = jsonSong.tracks.map(function(arr){
		return _.filter(arr, {subtype: 'trackName'})[0].text
	});

	var songName = tracks.shift();


	log(header,songName,tracks,beatsPerMinute)

	$('#songName').html(songName);

	var tracksEl = $('#tracks').html('');
	_.each(tracks, function(track,index){
		tracksEl.append($('<div>',{
			'text': track,
			'class': 'track',
			'data-track': index
		}))
	})

	var notes = _.filter(jsonSong.tracks[5], function(e){
			return e.subtype == 'noteOn' || e.subtype == 'noteOff'
		}).map(function(obj){
			return [obj.deltaTime,obj.subtype,obj.noteNumber]
	});



	clearInterval(timerObj);


	var timeEl = $('#time'),
			latencyEl = $('#latency'),
			precisionEl = $('#precision');


	debut = performance.now();

	// timerObj = setInterval(timer, tempo);

	window.onkeydown = function(e) {

		var measuredHit = (e.timeStamp - debut) / tempo,
				latency = measuredHit - Math.floor(measuredHit);

		var coords = closestInt(measuredHit)
		keyInts.push(coords[0]);
		keyLats.push(coords[1]);
		log('latence',coords[1]);
		latencyEl.html( truncate(mean(keyLats),3) );
		precisionEl.html( truncate( 100 - sigma(keyLats.slice(-10))*1000/3, 0 ));
	}

	var timeRAF = document.getElementById("timeRAF")

	function renderLoopRAF(){

	  var currTime = (performance.now() - debut) / tempo;

	  timeRAF.innerHTML = Math.floor(currTime)-1;

		if (window.requestAnimationFrame) window.requestAnimationFrame(renderLoopRAF);
	  else if (window.msRequestAnimationFrame) window.msRequestAnimationFrame(renderLoopRAF);
	  else if (window.mozRequestAnimationFrame) window.mozRequestAnimationFrame(renderLoopRAF);
	  else if (window.webkitRequestAnimationFrame) window.webkitRequestAnimationFrame(renderLoopRAF);

	}
	if (window.requestAnimationFrame) window.requestAnimationFrame(renderLoopRAF);
  else if (window.msRequestAnimationFrame) window.msRequestAnimationFrame(renderLoopRAF);
  else if (window.mozRequestAnimationFrame) window.mozRequestAnimationFrame(renderLoopRAF);
  else if (window.webkitRequestAnimationFrame) window.webkitRequestAnimationFrame(renderLoopRAF);


}

function draw() {
  var canvas = document.getElementById('canvas');
  if (canvas.getContext) {
    var ctx = canvas.getContext('2d');

    ctx.fillRect(25,25,100,100);
    ctx.clearRect(45,45,60,60);
    ctx.strokeRect(50,50,50,50);
  }
}
draw();

// Math helpers

function closestInt(x){
	var n = Math.floor(x);
	var d = x-n;
	if(d<0.5)
		return [n,d];
	else
		return [n+1,d-1];
}

var mul = function(X,Y) {
  return _.map(X,function(x,i){
      return x * Y[i];
  });
}
var add = function(X,Y) {
  return _.map(X,function(x,i){
      return x + Y[i];
  });
}
var divide = function(X,Y) {
  return _.map(X,function(x,i){
    if(Y[i])
      return x / Y[i];
    else return 0;
  });
}
var substract = function(X,Y) {
  return _.map(X,function(x,i){
      return x - Y[i];
  });
}

var vectPow = function(X,n) {
  return _.map(X,function(x){
      return Math.pow(x,n);
  });
}

var mean = function(X) {
    var m = 0;
    _.each(X,function(x){
        m = m + x;
    })
    m = m / X.length;
    return m;
}
var sigma = function(X) {
    // console.log('Multiplication',mul(X,X))
    return Math.sqrt(mean(mul(X,X)) - Math.pow(mean(X),2));
}
var truncate = function(num,range) {
    var p = Math.pow(10,range);
    return Math.floor(num*p)/p;
}


































// The drag and drop section

var obj = $("#drop");
obj.on('dragenter', function (e) {
    e.stopPropagation();
    e.preventDefault();
})
.on('dragover', function (e) {
     e.stopPropagation();
     e.preventDefault();
})
.on('drop', function (e) {
	e.preventDefault();
	var files = e.originalEvent.dataTransfer.files;
	console.log(files);
	var reader = new FileReader();

	reader.onloadend = function(file){
		midi2json(file.currentTarget.result)
	};

	reader.readAsBinaryString(files[0])

});

$(document).on('dragenter', function (e) {
    e.stopPropagation();
    e.preventDefault();
})
.on('dragover', function (e) {
  e.stopPropagation();
  e.preventDefault();
})
.on('drop', function (e) {
    e.stopPropagation();
    e.preventDefault();
});
