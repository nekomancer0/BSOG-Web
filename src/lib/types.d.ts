import * as Lands from './lands';

export type Effect<T, O = any> = (
	data: T,
	pos?: { x: number; y: number },
	callback?: (data: O) => T
) => void;

export type Unit = {
	category: string;
	name: string;
	image: string;
	stats: {
		hp: number;
		atk: number;
		currentHp: number;
		range: number;
		dodge?: number;
		movement: number;
	};

	pos?: {
		x: number;
		y: number;
	};

	on(event: string, callback: (...args: any[]) => void): void;

	emit(event: string, ...args: any[]): void;
};

// Create a union type of all land classes
export type LandType = InstanceType<(typeof Lands)[keyof typeof Lands]>;

// Create a type for land entries
export type LandEntry = {
	pos: { x: number; y: number };
	land: LandType;
};

export interface BoardInterface {
	units: Unit[];
	lands: LandEntry[];
}
