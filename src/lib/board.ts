import type { BoardInterface, LandEntry, Unit } from './types.d';
import * as Lands from './lands';

type boardEvents = {
	unitMove: (unit: Unit, position: { x: number; y: number }) => void;
	unitSpawn: (unit: Unit) => void;
	unitDelete: (unit: Unit) => void;
};

export class Board extends EventTarget implements BoardInterface {
	units: Unit[] = [];
	lands: LandEntry[] = [];

	constructor() {
		super();
		this.init();
	}

	spawnUnit(unit: Unit) {
		this.units.push(unit);
		this.emit('unitSpawn', unit);
	}

	deleteUnit(unit: Unit) {
		this.units = this.units.filter((u) => u.id !== unit.id);
		this.emit('unitDelete', unit);
	}

	moveUnit(unit: Unit, position: { x: number; y: number }) {
		this.units = this.units.map((u) => (u.id === unit.id ? { ...u, pos: position } : u));
		this.emit('unitMove', unit, position);
	}

	on(event: 'unitSpawn', listener: (unit: Unit) => void): void;
	on(event: 'unitMove', listener: (unit: Unit, position: { x: number; y: number }) => void): void;
	on(event: 'unitDelete', listener: (unit: Unit) => void): void;

	on(event: keyof boardEvents, listener: boardEvents[keyof boardEvents]) {
		// @ts-ignore
		this.addEventListener(event, listener);
	}

	emit(event: 'unitSpawn', unit: Unit): void;
	emit(event: 'unitMove', unit: Unit, position: { x: number; y: number }): void;
	emit(event: 'unitDelete', unit: Unit): void;

	emit(event: keyof boardEvents, ...args: Parameters<boardEvents[keyof boardEvents]>): void {
		// @ts-ignore
		this.dispatchEvent(new CustomEvent(event, { detail: args }));
	}

	init(): void {
		for (let x = 0; x < 8; x++) {
			for (let y = 0; y < 8; y++) {
				this.lands.push({ pos: { x, y }, land: new Lands.Steppes() });
			}
		}

		this.on('unitMove', (unit, position) => {
			this.lands.forEach((entry) => {
				if (entry.pos.x === position.x && entry.pos.y === position.y) {
					entry.land.emit('unitOn', unit);
				}
			});
		});
	}
}
