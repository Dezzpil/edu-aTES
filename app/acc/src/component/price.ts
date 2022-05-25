function getRandomInt(min: number, max: number) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min; //Максимум не включается, минимум включается
}

export const calculatePrice = () => {
	return getRandomInt(10, 40);
};
