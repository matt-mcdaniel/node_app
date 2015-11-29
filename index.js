var express = require('express');
var app = express();

var fs = require('fs');
var path = require('path');

var engines = require('consolidate');

var bodyParser = require('body-parser');

var exonerees = [];
fs.readFile('exonerees.json', {encoding: 'utf8'}, function(err, data) {
	if (err) throw err;

	JSON.parse(data).forEach(function(v) {
		var firstname = v['First Name'];
		var lastname = v['Last Name'];
		v.FirstName = firstname;
		v.LastName = lastname;
		exonerees.push(v);
	});
});

function getUserFilePath(lastname) {
	return path.join(__dirname, 'exonerees', lastname);
}

function getPerson(lastname) {
	var person = {};
	var l = lastname.toLowerCase();
	try {
		file = fs.lstatSync(getUserFilePath(lastname));
		person = JSON.parse(fs.readFileSync(getUserFilePath(lastname), {encoding: 'utf8'}));
	}
	catch (e) {
		exonerees.forEach(function(v) {
			if (v.LastName.toLowerCase() === l) {
				person = v;
			}
		});
	}
	return person;
}

function savePerson(lastname, person) {
	var fp = getUserFilePath(lastname);
	try {
		fs.unlinkSync(fp);
		fs.writeFileSync(fp, JSON.stringify(person, null, 2), {encoding: 'utf8'});
	}
	catch (e) {
		fs.writeFileSync(fp, JSON.stringify(person, null, 2), {encoding: 'utf8'});
	}
}

app.engine('hbs', engines.handlebars);

app.set('views', './views');
app.set('view engine', 'hbs');

app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', function(req, res) {	
	res.render('index', {exonerees: exonerees});
});

app.get('/:lastname', function(req, res) {
	var lastname = req.params.lastname;
	var person = getPerson(lastname);
	res.render('detail', {
		person: person
	});
});

app.put('/:lastname', function(req, res) {
	var lastname = req.params.lastname;
	var person = getPerson(lastname);

	var previous = {};
	Object.keys(req.body).forEach(function(v) {
		var previousValue = person[v];
		person[v] = req.body[v];
		previous[v] = previousValue;
	});
	person.previous = previous;
	savePerson(lastname, person);
	res.end();
});

var server = app.listen(3000, function() {
	console.log('server running at http://localhost:' + server.address().port);
});
