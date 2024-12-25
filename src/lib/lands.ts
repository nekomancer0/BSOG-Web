import { Land, type Unit } from './types';

export const Steppes = new Land({
	id: '0',
	effect: ({ units }: { units: Unit[] }) => {
		units.forEach((unit) => {
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
		});
	},
	image: '/lands/0.png',
	name: 'Steppes',
	type: 'Land',
	element: 'Neutral'
});
