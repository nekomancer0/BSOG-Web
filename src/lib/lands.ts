import { EventEmitter } from 'events';
import type { Effect, Unit } from './types.d';

type LandEvents = {
	unitOn: [unit: Unit];
};

export class Steppes extends EventEmitter<LandEvents> {
	id = 0;
	static id = 0;
	name: string = 'Land - Steppes';
	description = "Allies and enemies can't dodge attacks on adjacent lands.";
	image: string = '/lands/0.png';
	type: 'Neutral' = 'Neutral';
	position: { x: number; y: number } | null = null;

	constructor() {
		super();

		this.on('unitOn', (unit) => {
			this.effect({ units: [unit] });
		});
	}

	effect: Effect<{ units: Unit[] }> = ({ units }) => {
		units.forEach((unit) => {
			if (unit.pos?.x === this.position?.x && unit.pos?.y === this.position?.y) {
				let oldDodge = unit.stats.dodge;
				unit.stats.dodge = 0;

				unit.on('move', () => {
					if (unit.category === 'hero') {
						unit.stats.dodge = oldDodge;
					}
				});
			}
		});
	};
}
