// Generate a random deck of cards from the same elemental type

import * as Cards from './cards';
import * as Lands from './lands';

export async function generateDeckForRyuu() {
	// Retrieve card list json

	try {
		const module = JSON.parse(await (await fetch('/decks/ryuu.json')).text());

		let cardNames: (keyof typeof Cards | keyof typeof Lands)[] = module.list;

		// @ts-ignore
		let cards = cardNames.map((name) => (Cards[name] ? Cards[name] : Lands[name]));

		return cards;
	} catch (e) {
		console.error(e);
		throw e;
	}
}
