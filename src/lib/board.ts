import type { BoardInterface, LandEntry, Unit } from './types.d';
import * as Lands from './lands';

export class Board implements BoardInterface {
	units: Unit[] = [];
	lands: LandEntry[] = [];

	constructor() {
		this.init();
	}

	init(): void {
		for (let x = 0; x < 8; x++) {
			for (let y = 0; y < 8; y++) {
				this.lands.push({ pos: { x, y }, land: new Lands.Steppes() });
			}
		}
	}
}
