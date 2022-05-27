const readline = require('readline');

// TODO ввод максимально допустимого разброса значений (в процентах)
// TODO ввод максимально допустимого результат (в процентах)
// TODO расчет правильного кол-во значений (сейчас на одно больше)

function getRandomInt(min: number, max: number) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min; //Максимум не включается, минимум включается
}

const maxRange = 0.2; // 20%

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});
let center = 0;
rl.on('SIGINT', () => {
	process.exit(0);
});
rl.question('Input avg? ', (avgIn: string) => {
	const avg = parseInt(avgIn, 10);
	const maxValue = avg + avg * maxRange;
	const minValue = avg - avg * maxRange;

	// окрестность возможного значения среднего после компенсации
	const maxNearValue = avg + avg * 0.01;
	const minNearValue = avg - avg * 0.01;

	// console.log(avg, maxValue, minValue);

	rl.question('Input count of numbers? ', (numIn: string) => {
		const num = parseInt(numIn, 10);

		let halfNum = 0;
		if (num % 2 > 0) {
			halfNum = Math.floor(num - 1 / 2);
		} else {
			halfNum = Math.floor(num / 2);
		}

		// console.log(`half num: ${halfNum}`);

		const vals = [];
		const increased = [];
		for (let i = 0; i < halfNum; i++) {
			const val = getRandomInt(avg, maxValue);
			increased.push(val);
			vals.push(val);
		}

		const decreased = [];
		for (let i = 0; i < num - halfNum; i++) {
			const val = getRandomInt(minValue, avg);
			decreased.push(val);
			vals.push(val);
		}

		let sumBeforeCompensate = vals.reduce((acc, val) => acc + val, 0);
		let avgBeforeCompensate = sumBeforeCompensate / vals.length;

		// console.log(increased, decreased, sumBeforeCompensate, avgBeforeCompensate);

		while (true) {
			let compensator = 0;

			// console.log(avgBeforeCompensate, avg);
			if (avgBeforeCompensate > avg) {
				compensator = getRandomInt(minValue, avg);
			} else if (avgBeforeCompensate < avg) {
				compensator = getRandomInt(avg, maxValue);
			} else {
				break;
			}

			// console.log(`compensator: ${compensator}`);

			// компенсируем числа до среднего
			const newAvg = (sumBeforeCompensate + compensator) / (vals.length + 1);
			console.log(`near avg is ${newAvg} [${minNearValue};${maxNearValue}]`);
			if (newAvg >= minNearValue && newAvg <= maxNearValue) {
				vals.push(compensator);
				break;
			}
		}

		const sumAfterCompensate = vals.reduce((acc, val) => acc + val, 0);
		let avgAfterCompensate = sumAfterCompensate / vals.length;
		console.log(vals);
		console.log(`current avg: ${avgAfterCompensate}`);

		rl.close();
	});
});
