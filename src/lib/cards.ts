// Ability decorator to make the method a card ability

import { Hero, Spell, Artifact, Companion, type Type, Unit } from './types';

export const Relief = new Spell({
	name: 'Relief',
	id: '0',
	image: '/cards/relief.png',
	element: 'Primordial',
	type: 'Spell',
	effect: (target: Unit) => {
		target.updateStats({
			currentHp: target.stats.currentHp + 2
		});
	}
});

export const Ryuu = new Hero({
	element: 'Primordial',
	name: 'Ryuu',
	id: '0',
	image: '/cards/ryuu.png',
	stats: {
		hp: 20,
		atk: 2,
		currentHp: 20,
		dodge: 11,
		range: 2,
		movement: 2
	},
	type: 'Hero'
})
	.addAbility({
		name: "Ryuu's Blessing",
		passive: false,
		cost: [
			{
				type: 'Primordial',
				amount: 2
			}
		],
		effect: (target: Unit) => {
			target.updateStats({
				currentHp: target.stats.currentHp + 2
			});
		},
		description: 'Heal 2 HP'
	})
	.addAbility({
		name: "Ryuu's Might",
		passive: false,
		cost: [
			{
				type: 'Primordial',
				amount: 2
			}
		],
		effect: (target: Unit) => {
			target.updateStats({
				atk: target.stats.atk + 2
			});
		},
		description: 'Gain 2 ATK'
	});
