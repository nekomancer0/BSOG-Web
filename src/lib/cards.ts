// Ability decorator to make the method a card ability

import type { Card, Category, Effect, Type, Unit } from './types.d';

function Ability() {
	return function (target: any, propertyKey: string) {
		if (!target.constructor.abilities) {
			target.constructor.abilities = [];
		}

		target.constructor.abilities.push({
			name: propertyKey,
			effect: target[propertyKey],
			description: ''
		});
	};
}

export class Relief extends EventTarget implements Card {
	static abilities: { name: string; effect: Effect; description: string }[] = [];
	name: string = 'Relief';
	image: string = '';
	id: string = '0';
	type: Category = 'Spell';
	isHero = false;
	static isHero = false;

	element: Type = 'Primordial';

	constructor() {
		super();
	}

	on(event: string, callback: (...args: any[]) => void): void {
		// @ts-ignore
		this.addEventListener(event, callback);
	}

	emit(event: string, ...args: any[]): void {
		// @ts-ignore
		this.dispatchEvent(new CustomEvent(event, { detail: args }));
	}

	effect = () => {};
}

export class Ryuu extends EventTarget implements Unit {
	static abilities: { name: string; effect: Effect<any>; description: string }[] = [];

	isHero = true;
	static isHero = true;

	type: Category = 'Hero';

	category: string = 'Hero';
	id: string = '0';
	name: string = 'Ryuu';
	image: string = '/heroes/0.png';
	stats = {
		hp: 20,
		atk: 2,
		currentHp: 20,
		dodge: 11,
		range: 2,
		movement: 2
	};
	element: Type = 'Primordial';

	on(event: string, callback: (...args: any[]) => void): void {
		// @ts-ignore
		this.addEventListener(event, callback);
	}

	emit(event: string, ...args: any[]): void {
		// @ts-ignore
		this.dispatchEvent(new CustomEvent(event, { detail: args }));
	}

	constructor() {
		super();
	}

	updateStats: (data: Partial<Unit['stats']>) => void = (data) => {
		Object.assign(this.stats, data);
	};

	@Ability()
	heal(target: Unit) {
		target.updateStats({
			currentHp:
				target.stats.currentHp === target.stats.hp
					? target.stats.currentHp
					: target.stats.currentHp + 2
		});
	}

	effect(name: string, ...args: any[]) {
		const ability = Relief.abilities.find((ability) => ability.name === name);

		if (ability) {
			ability.effect(...args);
		}
	}
}
