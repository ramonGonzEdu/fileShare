function randToken(alpha, length) {
	let output = '';
	for (let i = 0; i < length; i++)
		output += alpha[(Math.random() * alpha.length) | 0];
	return output;
}

console.log(randToken('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567', 16));
