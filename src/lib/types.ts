import * as Lands from './lands';
export function getRowByPos(pos: { x: number; y: number }) {
	return document.querySelector<HTMLDivElement>(`.col-${pos.x} .row-${pos.y}`);
}
export type AbilityCost = {
	type: Type;
	amount: number;
}[];

export type Effect<T = any> = (...data: T[]) => void;
export type Category = 'Hero' | 'Companion' | 'Spell' | 'Artifact';
export type AbilityEntry<P extends boolean = boolean> = P extends false
	? {
			name: string;
			effect: Effect;
			description: string;
			cost: AbilityCost;
			passive: P;
		}
	: {
			name: string;
			effect: Effect;
			description: string;
			cost?: AbilityCost;
			passive: P;
		};

export abstract class BaseThing<C extends Category | 'Land'> extends EventTarget {
	abstract type: C;
	abstract element: Type;
	abstract name: string;
	abstract image: string;
	abstract id: string | number;
	abstract cost: C extends 'Hero' | 'Land' ? undefined : { type: Type; amount: number }[];

	once(event: string, callback: (...args: any[]) => void): void {
		// @ts-ignore
		this.addEventListener(event, callback, { once: true });
	}

	isHero(): this is Unit<'Hero'> {
		return this.type === 'Hero';
	}

	isCompanion(): this is Unit<'Companion'> {
		return this.type === 'Companion';
	}

	isArtifact(): this is Artifact<any> {
		return this.type === 'Artifact';
	}

	isLand(): this is Land<any> {
		return this.type === 'Land';
	}

	isSpell(): this is Spell<any> {
		return this.type === 'Spell';
	}

	abilityBuilder: <P extends boolean = false>(options: AbilityEntry<P>) => AbilityEntry = (
		options
	) => {
		return options;
	};

	abstract stats: C extends 'Hero'
		? {
				hp: number;
				atk: number;
				currentHp: number;
				range: number;
				movement: number;
				dodge: number;
			}
		: C extends 'Companion'
			? {
					hp: number;
					atk: number;
					currentHp: number;
					range: number;
					movement: number;
				}
			: undefined;

	constructor() {
		super();
	}

	on(event: string, callback: (...args: any[]) => void): void {
		// @ts-ignore
		this.addEventListener(event, (e: CustomEvent) => {
			// Extract the details and pass them directly to the callback
			callback(...e.detail);
		});
	}

	emit(event: string, ...args: any[]): void {
		this.dispatchEvent(
			new CustomEvent(event, {
				detail: args
			})
		);
	}

	onAny(callback: (eventName: string, ...args: any[]) => void): void {
		// @ts-ignore
		this.on('any', callback);
	}

	abstract effect: C extends 'Hero' | 'Companion'
		? (name: string, ...args: any[]) => any | void
		: (...args: any[]) => any | void;
}

export abstract class Unit<
	C extends 'Hero' | 'Companion' = 'Companion' | 'Hero'
> extends BaseThing<C> {
	abstract name: string;
	abstract image: string;
	abstract id: string;
	abstract stats: C extends 'Hero'
		? { hp: number; atk: number; currentHp: number; range: number; movement: number; dodge: number }
		: C extends 'Companion'
			? { hp: number; atk: number; currentHp: number; range: number; movement: number }
			: undefined;

	abilities: AbilityEntry[] = [];

	abstract element: Type;
	abstract pos?: {
		x: number;
		y: number;
	};
	abstract type: C;

	constructor() {
		super();

		this.on('statsUpdate', (data) => {
			this.fixDodge();
		});
	}

	isHero(): this is Unit<'Hero'> {
		return this.type === 'Hero';
	}
	fixDodge() {
		if (this.isHero()) {
			if (this.stats.dodge > 20) {
				this.stats.dodge = 20;
			}
		}
	}

	updateStats: (data: Partial<Unit['stats']>) => void = (data) => {
		this.emit('statsUpdate', data);
		this.stats = { ...this.stats, ...data };
	};
	on(event: string, callback: (...args: any[]) => void): void {
		// @ts-ignore
		this.addEventListener(event, callback);
	}
	emit(event: string, ...args: any[]): void {
		// @ts-ignore
		this.dispatchEvent(new CustomEvent(event, { detail: args }));
	}

	effect = (...args: any[]) => {
		this.abilities.find((ability) => ability.name === args[0])?.effect(...args);
	};

	addAbility<P extends boolean = false>(options: AbilityEntry<P>): this {
		this.abilities.push(options);
		return this;
	}
}

export abstract class Card<C extends Category = Category> extends BaseThing<C> {
	abstract name: string;
	abstract image: string;
	abstract id: string;
	abstract type: C;
	abstract element: Type;

	on(event: string, callback: (...args: any[]) => void): void {
		// @ts-ignore
		this.addEventListener(event, (e: CustomEvent) => {
			// Extract the details and pass them directly to the callback
			callback(...e.detail);
		});
	}

	emit(event: string, ...args: any[]): void {
		this.dispatchEvent(
			new CustomEvent(event, {
				detail: args
			})
		);
	}

	isHero(): this is Unit<'Hero'> {
		return false;
	}
}

export namespace Options {
	export interface Spell<T extends Type> {
		name: string;
		effect: Effect;
		id: string;
		image: string;
		type: 'Spell';
		element: T;
		cost: AbilityCost;
	}

	export interface Hero<T extends Type> {
		name: string;
		image: string;
		id: string;
		type: 'Hero';
		element: T;
		stats: {
			hp: number;
			atk: number;
			currentHp: number;
			range: number;
			movement: number;
			dodge: number;
		};
	}

	export interface Companion<T extends Type> {
		name: string;
		image: string;
		id: string;
		type: 'Companion';
		element: T;
		stats: {
			hp: number;
			atk: number;
			currentHp: number;
			range: number;
			movement: number;
		};
		cost: AbilityCost;
	}

	export interface Artifact<T extends Type> {
		name: string;
		image: string;
		id: string;
		type: 'Artifact';
		element: T;
		effect: Effect;
		cost: AbilityCost;
	}

	export interface Land<T extends Type> {
		name: string;
		image: string;
		id: string;
		type: 'Land';
		element: T;
		effect: Effect;
	}
}

export class Spell<T extends Type> extends BaseThing<'Spell'> {
	effect: (...args: any[]) => any | void;
	id: string;
	image: string;
	element: Type;
	name: string;
	stats: undefined;
	type: 'Spell' = 'Spell';
	cost: { type: Type; amount: number }[];

	constructor(options: Options.Spell<T>) {
		super();

		this.id = options.id;
		this.image = options.image;
		this.element = options.element;
		this.name = options.name;
		this.type = options.type;
		this.effect = options.effect;
		this.cost = options.cost;
	}
}

export class Companion<T extends Type> extends Unit<'Companion'> {
	id: string;
	image: string;
	element: Type;
	name: string;
	stats: {
		hp: number;
		atk: number;
		currentHp: number;
		range: number;
		movement: number;
	};

	type: 'Companion' = 'Companion';

	pos?: { x: number; y: number } | undefined;
	cost: { type: Type; amount: number }[];

	constructor(options: Options.Companion<T>) {
		super();

		this.id = options.id;
		this.image = options.image;
		this.element = options.element;
		this.name = options.name;
		this.type = options.type;
		this.stats = options.stats;
		this.cost = options.cost;
	}
}

export class Artifact<T extends Type> extends BaseThing<'Artifact'> {
	id: string;
	image: string;
	element: Type;
	name: string;
	stats: undefined;
	type: 'Artifact' = 'Artifact';
	effect: (...args: any[]) => any | void;
	cost: { type: Type; amount: number }[];

	constructor(options: Options.Artifact<T>) {
		super();

		this.id = options.id;
		this.image = options.image;
		this.element = options.element;
		this.name = options.name;
		this.type = options.type;
		this.effect = options.effect;
		this.cost = options.cost;
	}
}

export class Hero<T extends Type> extends Unit<'Hero'> {
	id: string;
	image: string;
	element: Type;
	name: string;
	stats: {
		hp: number;
		atk: number;
		currentHp: number;
		range: number;
		movement: number;
		dodge: number;
	};
	cost: undefined;

	type: 'Hero' = 'Hero';

	pos?: { x: number; y: number } | undefined;

	constructor(options: Options.Hero<T>) {
		super();

		this.id = options.id;
		this.image = options.image;
		this.element = options.element;
		this.name = options.name;
		this.type = options.type;
		this.stats = options.stats;
	}
}

export class Land<T extends Type> extends BaseThing<'Land'> {
	id: string;
	image: string;
	element: Type;
	name: string;
	stats: undefined;
	type: 'Land' = 'Land';
	cost: undefined;

	position: { x: number; y: number } | null = null;

	effect: (...args: any[]) => any | void;

	on(event: 'unitEnter', callback: (unit: Unit<'Companion' | 'Hero'>) => void): void;
	on(event: 'unitExit', callback: (unit: Unit<'Companion' | 'Hero'>) => void): void;
	on(event: string, callback: (...args: any[]) => void): void {
		super.addEventListener(event, callback);
	}

	constructor(options: Options.Land<T>) {
		super();

		this.id = options.id;
		this.image = options.image;
		this.element = options.element;
		this.name = options.name;
		this.type = options.type;
		this.effect = options.effect;

		this.on('unitEnter', (unit) => {
			this.effect({ units: [unit] });
			this.emit('trigger');
		});
	}
}

// Create a union type of all land instances
export type LandType = (typeof Lands)[keyof typeof Lands];

// Create a type for land entries
export type LandEntry = {
	pos: { x: number; y: number };
	land: LandType;
};

export interface BoardInterface {
	units: Unit[];
	lands: LandEntry[];
}

export type Type = 'Erudite' | 'Neutral' | 'Sylvester' | 'Shadows' | 'Primordial';
