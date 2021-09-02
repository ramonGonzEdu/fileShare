// setup a basic express server that only responds to localhost.
import express from 'express';
import totp from 'totp-generator';
import multer from 'multer';
// import fileUpload from 'express-fileupload';
// import body from 'body-parser';
import { fstat, readFileSync, writeFile, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import pug from 'pug';

const upload = multer({ destination: './files/' });
const moduleURL = new URL(import.meta.url);

const users = JSON.parse(readFileSync('./users.json'));
const fileMeta = JSON.parse(readFileSync('./filedb.json'));

function randToken() {
	// Generate a random token of 16 letters with the hexadecimal alphabet
	let output = '';
	let alphabet = '0123456789ABCDEF';
	for (let i = 0; i < 16; i++) {
		output += alphabet[Math.floor(Math.random() * 16)];
	}
	return output;
}

function saveDB() {
	// Save fileMeta and users to their respective files
	const data = JSON.stringify(fileMeta, null, 2);
	writeFileSync('./filedb.json', data);
	const data2 = JSON.stringify(users, null, 2);
	writeFileSync('./users.json', data2);
}

const app = express();

app.set('view engine', 'pug');

// app.use(json());

app.get('/', (req, res) => {
	// res.sendFile(join(dirname(moduleURL.pathname), './public/index.html'));

	res.render('index', { users: Object.keys(users) });
});

app.use('/assets/', express.static('./assets/'));

app.get('/files/:user', (req, res) => {
	// console.log(req.params);
	// res.send('Hello user dir');
	res.render('userlist', {
		user: req.params.user,
		files: Object.keys(fileMeta[req.params.user]),
	});
});

app.get('/files/:user/:filename', (req, res) => {
	if (fileMeta[req.params.user][req.params.filename].secret) {
		res.render('challenge', {
			user: req.params.user,
			file: req.params.filename,
		});
	} else {
		res
			.status(200)
			.send(
				`<script>location.pathname="/files/${req.params.user}/get/${req.params.filename}";</script>`
			)
			.end();
	}
});

app.get('/files/:user/get/:filename', (req, res) => {
	if (
		!fileMeta[req.params.user] ||
		!fileMeta[req.params.user][req.params.filename]
	) {
		res.status(300).send('File does not exist.').end();
	}
	if (fileMeta[req.params.user][req.params.filename].secret) {
		res.status(401).send('This file requires a post request.').end();
		// res.render();
	} else {
		res.sendFile(
			join(
				dirname(moduleURL.pathname),
				'./files/',
				fileMeta[req.params.user][req.params.filename].id
			)
		);
	}
});

app.post('/files/:user/get/:filename', upload.any(), (req, res) => {
	if (
		!fileMeta[req.params.user] ||
		!fileMeta[req.params.user][req.params.filename]
	) {
		res.status(300).send('File does not exist.').end();
	}
	if (fileMeta[req.params.user][req.params.filename].secret) {
		if (
			typeof req.body.sec == 'string' &&
			+totp(users[req.params.user]) == +req.body.sec
		) {
			res.sendFile(
				join(
					dirname(moduleURL.pathname),
					'./files/',
					fileMeta[req.params.user][req.params.filename].id
				)
			);
		} else {
			res.status(401).send('Incorrect code.').end();
		}
	} else {
		res.sendFile(
			join(
				dirname(moduleURL.pathname),
				'./files/',
				fileMeta[req.params.user][req.params.filename].id
			)
		);
	}
});

app.get('/upload', function (req, res) {
	res.render('fileUpload');
});

// Define post api that allows file uploads to the files directory
app.post('/api/uploadFile', upload.any(), (req, res, next) => {
	// console.log(req);
	console.log(req.body.user, users, req.files.length);
	if (
		typeof req.body.user == 'string' &&
		req.body.user in users &&
		req.files.length > 0
	) {
		const secret = users[req.body.user];
		const fileid = randToken();
		console.log(totp(secret));
		if (totp(secret) == +req.body.sec) {
			writeFile('./files/' + fileid, req.files[0].buffer, () => {
				fileMeta[req.body.user] = fileMeta[req.body.user] ?? {};
				fileMeta[req.body.user][req.files[0].originalname] = {
					id: fileid,
					secret: false,
				};
				res.status(201).send('<script>window.href="/"</script>').end();
			});
		}
	} else {
		res.status(304).end();
	}
});

app.listen(8082, 'localhost');

process.on('SIGINT', () => {
	saveDB();
	process.exit();
});
