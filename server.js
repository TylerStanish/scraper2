var express = require('express');
var fs = require('fs');
var cheerio = require('cheerio');
var request = require('request');
var app = express();
var hbs = require('hbs');
var _ = require('lodash');

app.set('view engine', 'hbs');

var getPageData = function(url, cb){
	request({url: url, pool: {maxSockets: Infinity}}, function(err, res, body){
		if(err){
			console.log(err);
		}
		var $ = cheerio.load(body);
		// var $ = cheerio.load(fs.readFileSync(url));
		var jsonArr = [];
		$('#content-area').filter(function(){
			$(this).children('#content-inner')
				.children('#wrapper')
				.children('#container')
				.children('table').map(function(i, el){
					let trade = {
						t1: null,
						t2: null,
						t1acq: [],
						t2acq: [],
						date: null
					};
					trade.t1 = $(this).children('tbody').children('tr').first().children('td').first().children('strong').text().replace(' acquire', '');
					trade.t2 = $(this).children('tbody').children('tr').first().children('td').last().children('strong').text().replace(' acquire', '');
					$(this).children('tbody')
						.children('tr').last()
						.children('td').first()
						.children('table')
						.children('tbody')
						.children('tr')
						.children('td').last().children('span')
						.map(function(i1, el1){
							try{
								trade.t1acq.push($(this).text());
							}catch(err){
								trade.t1acq.push($(this).children('a').text());
							}
					});
					$(this).children('tbody')
						.children('tr').last()
						.children('td').last()
						.children('table')
						.children('tbody')
						.children('tr')
						.children('td').first().children('span')
						.map(function(i1, el1){
							try{
								trade.t2acq.push($(this).text());
							}catch(err){
								trade.t2acq.push($(this).children('a').text());
							}
					});
					trade.date = $(this).children('tbody')
						.children('tr').last().children('td').first().next().text();
					//console.log(trade);
					jsonArr.push(trade);
				});
			cb(jsonArr);
		});
	});
}

var getUrl = (year, page, cb) => {
	let yrplone = year + 1;
	let url = 'http://www.nhltradetracker.com/user/trade_list_by_season/' + year + '-' + yrplone.toString().substring(2,4) + '/' + page;
	cb(url);
}

var arr = [];
var baseUrl = 'http://www.nhltradetracker.com/user/trade_list_by_season/';
var yearCount = 1990;
var pageCount = 1;
var pageLen = 1;
var getSiteData = function(yrCount, pgCount){
	getUrl(yrCount, pgCount, function(url){
		getLength(url, function(len){
			pageLen = len;
		});
	})
}

var getLength = (url, cb) => {
	let length = 0;
	request(url, function(err, res, body){
		var $ = cheerio.load(body);
		var length;
		$('#content-area').filter(function(){
			length = $(this).children('#content-inner').children('#wrapper').children('#container').children('.pagination').length;
			cb(length);
		});
	});
}

app.get('/scrape', function(req, res){
	let multdimarr = [];
	for(i = 1990; i<2017; i++){
		console.log('traversing year ' + i);
		let iplusone = i + 1;
		let url = baseUrl + i + '-' + iplusone.toString().substring(2,4) + '/';
		console.log(url);
		//getLength(url, function(len){
			console.log('fetching length for url: ' + url);
			setTimeout(() => {	
				let counter = 1;
				for(j = 1; j<=8; j++){
					setTimeout(() => {
						console.log('traversing %s', url + counter);
						getPageData(url + counter, function(jsonArr){
							jsonArr.map(arr => {
								multdimarr.push(arr);
							});
							counter++;
						});
					}, j*2000);
				}
			}, (i-1990)*16000);
		//});
	}
	res.render('index', {content: 'blablabla'});
	// change this
	setTimeout(() => {
		fs.writeFile('output.json', JSON.stringify(multdimarr));
		console.log('success!');
	}, (27 * 16000) + 60000);
});

var count = 0;
var scrapePlayer = function(url, cb){
	request({url: url, pool: {maxSockets: Infinity}}, function(err, res, body){
	try{let $ = cheerio.load(body);
		let dataToScreen;
		let data = {};

		let indWithObj = {};
		let whenTogetherObj = {		}
		let playerWhenApartObj = {}
		let teammateWhenApartObj = {}
		let togetherObj = {}
		let playerApartObj = {}
		let teammateApartObj = {}

		let indAgainstObj = {}
		let playerWhenAgainstObj = {}
		let playerWhenNotAgainstObj = {}
		let opponentNotAgainstPlayerObj = {}

		let infoObj = {}

		data.name = $('h2').text();
		// here's the problem
		if($('h2').text().includes(', , ,')){
			return;
		}

		let firstTable = $('table').eq(-3);
		let secondTable = $('table').eq(-2);
		let thirdTable = $('table').last();
		
		data.with = {
			info: [],
			indWith: [],
			whenTogether: [],
			playerWhenApart: [],
			teammateWhenApart: [],
			together: [],
			playerApart: [],
			teammateApart: []
		};
		data.against = {
			info: [],
			indAgainst: [],
			playerWhenAgainst: [],
			playerWhenNotAgainst: [],
			opponentNotAgainstPlayer: []
		};

		let rowInfoTogether = firstTable.find('tbody').find('tr').eq(1).find('th');
		let rowInfoTogetherArray = [];
		rowInfoTogether.map(function(ind, el){
			rowInfoTogetherArray[ind] = $(this).text();
			if(ind < 2){
				infoObj[$(this).text()] = null;
			}
			if((ind > 1) && (ind < 7)){
				indWithObj[$(this).text()] = null;
			}
			if(ind > 7 && ind < 15){
				whenTogetherObj[$(this).text()] = null;
			}
			if(ind > 15 && ind < 23){
				playerWhenApartObj[$(this).text()] = null;
			}
			if(ind > 23 && ind < 31){
				teammateWhenApartObj[$(this).text()] = null;
			}
			if(ind > 31 && ind < 36){
				togetherObj[$(this).text()] = null;
			}
			if(ind > 36 && ind < 41){
				playerApartObj[$(this).text()] = null;
			}
			if(ind > 41 && ind < 45){
				teammateApartObj[$(this).text()] = null;
			}
		});

		let rowInfoAgainst = secondTable.find('tbody').find('tr').eq(1).find('th');
		let rowInfoAgainstArray = [];
		rowInfoAgainst.map(function(ind, el){
			rowInfoAgainstArray[ind] = $(this).text();
			if(ind < 2){
				infoObj[$(this).text()] = null;
			}
			if((ind > 1) && (ind < 7)){
				indAgainstObj[$(this).text()] = null;
			}
			if(ind > 7 && ind < 15){
				playerWhenAgainstObj[$(this).text()] = null;
			}
			if(ind > 15 && ind < 23){
				playerWhenNotAgainstObj[$(this).text()] = null;
			}
			if(ind > 23 && ind < 31){
				opponentNotAgainstPlayerObj[$(this).text()] = null;
			}
		});

		firstTable.find('tbody').find('tr').map(function(ind, el){
			infoObj = {};
			indWithObj = {};
			whenTogetherObj = {};
			playerWhenApartObj = {};
			teammateWhenApartObj = {};
			togetherObj = {};
			playerApartObj = {};
			teammateApartObj = {};
			$(this).find('td').map(function(j, elem){
				if(j < 2){
					infoObj[rowInfoTogetherArray[j]] = $(this).text();
				}
				if((j > 1) && (j < 7)){
					indWithObj[rowInfoTogetherArray[j]] = $(this).text();
					
				}
				if(j > 7 && j < 15){
					whenTogetherObj[rowInfoTogetherArray[j]] = $(this).text();
					
				}
				if(j > 15 && j < 23){
					playerWhenApartObj[rowInfoTogetherArray[j]] = $(this).text();
					
				}
				if(j > 23 && j < 31){
					teammateWhenApartObj[rowInfoTogetherArray[j]] = $(this).text();
					
				}
				if(j > 31 && j < 36){
					togetherObj[rowInfoTogetherArray[j]] = $(this).text();
					
				}
				if(j > 36 && j < 41){
					playerApartObj[rowInfoTogetherArray[j]] = $(this).text();
					
				}
				if(j > 41 && j < 45){
					teammateApartObj[rowInfoTogetherArray[j]] = $(this).text();
					
				}
			});
			if(_.isEmpty(infoObj)){
				return;
			}
			data.with.info.push(infoObj);
			data.with.indWith.push(indWithObj);
			data.with.whenTogether.push(whenTogetherObj);
			data.with.playerWhenApart.push(playerWhenApartObj);
			data.with.teammateWhenApart.push(teammateWhenApartObj);
			data.with.together.push(togetherObj);
			data.with.playerApart.push(playerApartObj);
			data.with.teammateApart.push(teammateApartObj);
		});

		secondTable.find('tbody').find('tr').map(function(j, el){
			infoObj = {};
			indAgainstObj = {};
			playerWhenAgainstObj = {};
			playerWhenNotAgainstObj = {};
			opponentNotAgainstPlayerObj = {};
			$(this).find('td').map(function(ind, elem){
				if(ind < 2){
					infoObj[rowInfoAgainstArray[ind]] = $(this).text();
				}
				if((ind > 1) && (ind < 7)){
					indAgainstObj[rowInfoAgainstArray[ind]] = $(this).text();
				}
				if(ind > 7 && ind < 15){
					playerWhenAgainstObj[rowInfoAgainstArray[ind]] = $(this).text();
				}
				if(ind > 15 && ind < 23){
					playerWhenNotAgainstObj[rowInfoAgainstArray[ind]] = $(this).text();
				}
				if(ind > 23 && ind < 31){
					opponentNotAgainstPlayerObj[rowInfoAgainstArray[ind]] = $(this).text();
				}
			});
			if(_.isEmpty(infoObj)){
				return;
			}
			data.against.info.push(infoObj);
			data.against.indAgainst.push(indAgainstObj);
			data.against.playerWhenAgainst.push(playerWhenAgainstObj);
			data.against.playerWhenNotAgainst.push(playerWhenNotAgainstObj);
			data.against.opponentNotAgainstPlayer.push(opponentNotAgainstPlayerObj);
		});

		thirdTable.find('tbody').find('tr').map(function(j, el){
			infoObj = {};
			indAgainstObj = {};
			playerWhenAgainstObj = {};
			playerWhenNotAgainstObj = {};
			opponentNotAgainstPlayerObj = {};
			$(this).find('td').map(function(ind, elem){
				if(ind < 2){
					infoObj[rowInfoAgainstArray[ind]] = $(this).text();
				}
				if((ind > 1) && (ind < 7)){
					indAgainstObj[rowInfoAgainstArray[ind]] = $(this).text();
				}
				if(ind > 7 && ind < 15){
					playerWhenAgainstObj[rowInfoAgainstArray[ind]] = $(this).text();
				}
				if(ind > 15 && ind < 23){
					playerWhenNotAgainstObj[rowInfoAgainstArray[ind]] = $(this).text();
				}
				if(ind > 23 && ind < 31){
					opponentNotAgainstPlayerObj[rowInfoAgainstArray[ind]] = $(this).text();
				}
			});
			if(_.isEmpty(infoObj)){
				return;
			}
			data.against.info.push(infoObj);
			data.against.indAgainst.push(indAgainstObj);
			data.against.playerWhenAgainst.push(playerWhenAgainstObj);
			data.against.playerWhenNotAgainst.push(playerWhenNotAgainstObj);
			data.against.opponentNotAgainstPlayer.push(opponentNotAgainstPlayerObj);
		});

		//fs.writeFile('scrape.json', JSON.stringify(data));
		cb(data);
	}catch(e){
		console.log('error' + count);
		count++;
	}
	});
}

app.get('/scrapewowylist', function(req, res){
	let json = [];
	// the seasons go by 2016-17
	let baseUrl = 'http://stats.hockeyanalysis.com/showplayer.php?season=';
	let baseUrl1 = '&sit=5v5&pid=';
	let baseUrl2 = '&withagainst=true';
	for(i = 2007; i < 2017; i++){
		let iplusone = i + 1;
		let season = i + '-' + iplusone.toString().substring(2, 4);
		let obj = {season: season, data: []};
		setTimeout(() => {
			let c = 0;
			for(j = 0; j < 2500; j++){
				setTimeout(() => {
					let url = baseUrl + season + baseUrl1 + c + baseUrl2;
					console.log(c + ':' + season);
					scrapePlayer(url, function(d){
						obj.data.push(d);
					});
					c++;
				}, 500*j);
			}
			json.push(obj);
			setTimeout(() => {
				fs.writeFile('scrape' + season + '.json', JSON.stringify(obj), function(err){
					if(!err){
						console.log('wrote' + season);
					}
				});
			}, 500*2500);
		}, 2500 * (i-2007) * 500 + 500);
	}
	setTimeout(() => {
		fs.writeFile('scrape.json', JSON.stringify(json));
		console.log('complete');
	}, 2500 * (i-2007) * 500 + 1000 ); // the + 500 at the end is for good measure just in case.
	res.render('index', {content: 'blablablablalbalbla'});
});

app.get('/scrapewowy', function(req, res){
	let json = [];
	request({url: 'http://stats.hockeyanalysis.com/players.php', pool: {maxSockets: Infinity}}, function(err, res, body){
		let $ = cheerio.load(body);
		let data;
		while(!data){
			$('table').filter(function(){
				data = $(this).children('tbody').children('tr');
			});
		}
		data.map(function(i, el){
			$(this).map(function(ind, ele){
				let obj = {
					name: $(this).text()
				}
			});
		});
		// the page has 2552 players in it
	});
	res.render('index', {content: 'blablabla'});
});

app.listen(8081);
console.log('app\'s up');

exports = module.exports = app;



