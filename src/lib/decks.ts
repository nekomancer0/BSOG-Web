// Generate a random deck of cards from the same elemental type

import type { Card, Type } from './types';
import * as Cards from './cards';

export function isHeroUnit<T extends { isHero: boolean }>(card: T) {
	return card.isHero;
}

export async function generateDeckForRyuu() {
	// Retrieve card list json

	try {
		const module = JSON.parse(await (await fetch('/decks/ryuu.json')).text());

		let cardNames: (keyof typeof Cards)[] = module.list;

		let cards = cardNames.map((name) => new Cards[name]());

		return cards;
	} catch (e) {
		console.error(e);
		throw e;
	}
}
