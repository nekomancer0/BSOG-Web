import * as Lands from './lands';

export type Effect<T = any[]> = (...data: T) => void;
export type Category = "Hero" | "Companion" | "Land" | "Spell" | "Artifact";

export type Unit = {
	category: string;
	name: string;
	image: string;
	id: string;
	isHero: boolean = false;
	stats: {
		hp: number;
		atk: number;
		currentHp: number;
		range: number;
		dodge?: number;
		movement: number;
	};
	element: Type;
	pos?: {
		x: number;
		y: number;
	};

	type: Category = "Hero";

	updateStats: (data: Partial<Unit['stats']>) => void;

	on(event: string, callback: (...args: any[]) => void): void;

	emit(event: string, ...args: any[]): void;
};

export type Card = {
	name: string;
	image: string;
	id: string;
	type: Category;
	element: Type = "Neutral";
	on(event: string, callback: (...args: any[]) => void): void;

	emit(event: string, ...args: any[]): void;

	effect: Effect<any>;
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

export type Type = "Erudite" | "Neutral" | "Sylvester" | "Shadows" | "Primordial"
