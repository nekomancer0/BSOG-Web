import { Land, type Unit } from './types';

export const Steppes = new Land({
	id: '0',
	effect: (unit: Unit) => {
		if (unit.pos?.x === Steppes.position?.x && unit.pos?.y === Steppes.position?.y) {
			console.log(unit);
			if (unit.isHero()) {
				let oldDodge = unit.stats.dodge;
				unit.stats.dodge = 0;

				unit.on('move', () => {
					unit.stats.dodge = oldDodge;
				});
			}
		}
	},
	image: '/lands/0.png',
	name: 'Steppes',
	type: 'Land',
	element: 'Neutral'
});

export const Trap = new Land({
	id: '1',
	image: '/lands/1.png',
	name: 'Trap',
	type: 'Land',
	element: 'Neutral',
	effect: (unit: Unit) => {
		// Unit can't move or attack this turn if it's on this land

		// oldStats var is updated two times causing the movement and atk to be 0, so we need to prevent that

		let oldStats = unit.stats;

		if (unit.affectBy === Trap.id) return;

		unit.updateStats({
			movement: 0,
			atk: 0
		});

		unit.affect(Trap.id);

		// Next turn, reset movement and atk

		unit.on('turnStart', () => {
			unit.updateStats(oldStats);

			// Now, destroy this land and replace by Steppes;

			unit.affectBy = null;
			Trap.emit('destroy');
		});
	}
});
